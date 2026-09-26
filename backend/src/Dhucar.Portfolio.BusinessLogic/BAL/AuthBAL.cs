using System.Security.Cryptography;
using System.Text;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  26 Sep 2026
 * Modified Reason :  Passkey-only switch (settings/security.IsPasswordLoginEnabled).
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Admin setup and sign-in: password plus TOTP (or a recovery code), lockout, recovery codes and step-up checks.
 */
public class AuthBAL(
    UserDAL userDAL,
    ChallengeDAL challengeDAL,
    PasskeyDAL passkeyDAL,
    SettingsDAL settingsDAL,
    PasswordService passwordService,
    TotpService totpService,
    SecretProtector secretProtector,
    RecoveryCodeService recoveryCodeService,
    TokenService tokenService,
    SessionBAL sessionBAL,
    AuditBAL auditBAL,
    IContextService contextService,
    IOptions<PortfolioSettings> options,
    ICodeLogger codeLog)
{
    // Single-admin site: a fixed id makes a second concurrent setup fail on the primary key.
    private const string AdminUserId = "admin";
    private const string TotpIssuer = "dhucar.in";
    private const string InvalidCredentials = "Invalid email or password.";
    private const string PasswordLoginOff = "Password sign-in is turned off. Sign in with your passkey.";
    private readonly SecuritySettings _security = options.Value.Security;

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SetupAdmin
    // Method Description    :   Creates the admin account with the server's one-time setup token and starts TOTP enrolment.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SetupAdmin : </c> Creates the admin account with the server's one-time setup token and starts TOTP enrolment.
    /// </summary>
    public async Task<Response<object>> SetupAdmin(SetupAdminRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            if (_security.SetupToken.Length < 32)
            {
                return Fail(objResponse, ErrorCode.Forbidden, "Setup is disabled.");
            }
            if (!FixedTimeEquals(objAPIRequest.SetupToken, _security.SetupToken))
            {
                await auditBAL.Write("setup.denied", false, string.Empty, string.Empty, "bad setup token");
                return Fail(objResponse, ErrorCode.Forbidden, "Setup is disabled.");
            }
            string email = NormalizeEmail(objAPIRequest.Email);
            if (!IsValidEmail(email))
            {
                return Fail(objResponse, ErrorCode.ValidationFailed, "Enter a valid email.");
            }
            if (!passwordService.IsAcceptable(objAPIRequest.Password))
            {
                return Fail(objResponse, ErrorCode.ValidationFailed, "Password must be 12 to 128 characters.");
            }
            AdminUserDocument? existing = await userDAL.GetUserByIdDB(AdminUserId);
            if (existing != null && existing.IsTotpConfirmed)
            {
                return Fail(objResponse, ErrorCode.Conflict, "The admin account already exists.");
            }
            string secret = totpService.GenerateSecret();
            AdminUserDocument user = new AdminUserDocument
            {
                Id = AdminUserId,
                Email = email,
                PasswordHash = passwordService.Hash(objAPIRequest.Password),
                TotpSecretProtected = secretProtector.Protect(secret),
                SecurityStamp = tokenService.NewOpaqueToken(),
                UserHandle = RandomNumberGenerator.GetBytes(32),
                CreatedAt = DateTime.UtcNow,
            };
            if (existing != null)
            {
                // Enrolment was never finished: start it again from scratch.
                await userDAL.DeleteUnconfirmedUserDB(AdminUserId);
            }
            try
            {
                await userDAL.InsertUserDB(user);
            }
            catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
            {
                return Fail(objResponse, ErrorCode.Conflict, "The admin account already exists.");
            }
            string challengeId = tokenService.NewOpaqueToken();
            await challengeDAL.InsertChallengeDB(new AuthChallengeDocument
            {
                Id = challengeId,
                Kind = "enroll",
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            });
            (string enrollmentToken, _) = tokenService.CreatePurposeToken(user.Id, "enroll", challengeId, 15);
            await auditBAL.Write("setup.started", true, user.Id, email, string.Empty);
            objResponse.Data = new SetupAdminResponseDTO
            {
                EnrollmentToken = enrollmentToken,
                TotpSecret = secret,
                OtpAuthUri = totpService.BuildUri(TotpIssuer, email, secret),
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Scan the code in your authenticator app, then confirm with a code.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SetupAdmin", string.Empty, nameof(SetupAdmin));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ConfirmTotpSetup
    // Method Description    :   Verifies the first authenticator code, activates the account and returns recovery codes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ConfirmTotpSetup : </c> Verifies the first authenticator code, activates the account and returns recovery codes.
    /// </summary>
    public async Task<Response<object>> ConfirmTotpSetup(ConfirmTotpSetupRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            (string UserId, string ChallengeId)? claims = await tokenService.ValidatePurposeToken(objAPIRequest.EnrollmentToken, "enroll");
            if (claims == null || await challengeDAL.PeekChallengeDB(claims.Value.ChallengeId, "enroll") == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Enrolment expired. Run setup again.");
            }
            AdminUserDocument? user = await userDAL.GetUserByIdDB(claims.Value.UserId);
            if (user == null || user.IsTotpConfirmed)
            {
                return Fail(objResponse, ErrorCode.Conflict, "Enrolment is already complete.");
            }
            string secret = secretProtector.Unprotect(user.TotpSecretProtected);
            if (!totpService.Verify(secret, objAPIRequest.Code, user.LastTotpStep, out long step))
            {
                await auditBAL.Write("setup.totp-failed", false, user.Id, user.Email, string.Empty);
                return Fail(objResponse, ErrorCode.Unauthorized, "That code didn't match. Check the time on your device and try again.");
            }
            if (await challengeDAL.TakeChallengeDB(claims.Value.ChallengeId, "enroll") == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Enrolment expired. Run setup again.");
            }
            (List<string> codes, List<string> hashes) = recoveryCodeService.Generate();
            if (!await userDAL.ConfirmTotpDB(user.Id, step, hashes))
            {
                return Fail(objResponse, ErrorCode.Conflict, "Enrolment is already complete.");
            }
            await auditBAL.Write("setup.completed", true, user.Id, user.Email, string.Empty);
            objResponse.Data = new RecoveryCodesDTO { RecoveryCodes = codes };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Two-factor sign-in is on. Store these recovery codes offline; each works once.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step ConfirmTotpSetup", string.Empty, nameof(ConfirmTotpSetup));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Login
    // Method Description    :   First factor: checks the password and returns a short-lived MFA token.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :   26 Sep 2026
    // Modified Reason       :   Passkey-only switch (settings/security.IsPasswordLoginEnabled).
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Passkey-only switch
    //****************************************************************************************************
    /// <summary>
    /// <c>Login : </c> First factor: checks the password and returns a short-lived MFA token.
    /// </summary>
    public async Task<Response<object>> Login(LoginRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            // Checked before the account lookup, so it says nothing about which emails exist.
            if (!await IsPasswordLoginAllowed())
            {
                await auditBAL.Write("login.password-disabled", false, string.Empty, NormalizeEmail(objAPIRequest.Email), string.Empty);
                return Fail(objResponse, ErrorCode.Forbidden, PasswordLoginOff);
            }
            string email = NormalizeEmail(objAPIRequest.Email);
            string password = objAPIRequest.Password ?? string.Empty;
            if (email.Length == 0 || password.Length == 0 || password.Length > 128)
            {
                return Fail(objResponse, ErrorCode.ValidationFailed, "Enter your email and password.");
            }
            AdminUserDocument? user = await userDAL.GetUserByEmailDB(email);
            if (user == null || !user.IsTotpConfirmed)
            {
                passwordService.VerifyDummy(password);
                await auditBAL.Write("login.password-failed", false, string.Empty, email, "unknown account");
                return Fail(objResponse, ErrorCode.Unauthorized, InvalidCredentials);
            }
            if (IsLockedOut(user))
            {
                await auditBAL.Write("login.locked", false, user.Id, email, string.Empty);
                return Fail(objResponse, ErrorCode.LockedOut, "Too many attempts. Try again later.");
            }
            if (!passwordService.Verify(user.PasswordHash, password))
            {
                await userDAL.RecordFailureDB(user.Id, _security.MaxFailedAttempts, _security.LockoutMinutes);
                await auditBAL.Write("login.password-failed", false, user.Id, email, string.Empty);
                return Fail(objResponse, ErrorCode.Unauthorized, InvalidCredentials);
            }
            string challengeId = tokenService.NewOpaqueToken();
            await challengeDAL.InsertChallengeDB(new AuthChallengeDocument
            {
                Id = challengeId,
                Kind = "mfa",
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            });
            (string mfaToken, DateTime expiresAt) = tokenService.CreatePurposeToken(user.Id, "mfa", challengeId, 5);
            objResponse.Data = new MfaChallengeDTO { MfaToken = mfaToken, ExpiresAt = expiresAt };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Enter the code from your authenticator app.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step Login", string.Empty, nameof(Login));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   VerifyMfa
    // Method Description    :   Second factor: a TOTP code or a single-use recovery code; starts the session.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :   26 Sep 2026
    // Modified Reason       :   Passkey-only switch (settings/security.IsPasswordLoginEnabled).
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Passkey-only switch
    //****************************************************************************************************
    /// <summary>
    /// <c>VerifyMfa : </c> Second factor: a TOTP code or a single-use recovery code; starts the session.
    /// </summary>
    public async Task<Response<object>> VerifyMfa(VerifyMfaRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            // A sign-in started before the switch was turned off can't be finished after it.
            if (!await IsPasswordLoginAllowed())
            {
                return Fail(objResponse, ErrorCode.Forbidden, PasswordLoginOff);
            }
            (string UserId, string ChallengeId)? claims = await tokenService.ValidatePurposeToken(objAPIRequest.MfaToken, "mfa");
            if (claims == null || await challengeDAL.PeekChallengeDB(claims.Value.ChallengeId, "mfa") == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Sign-in expired. Start again.");
            }
            AdminUserDocument? user = await userDAL.GetUserByIdDB(claims.Value.UserId);
            if (user == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Sign-in expired. Start again.");
            }
            if (IsLockedOut(user))
            {
                return Fail(objResponse, ErrorCode.LockedOut, "Too many attempts. Try again later.");
            }
            List<string> authMethods = new List<string> { "pwd" };
            bool isVerified = false;
            if (!string.IsNullOrWhiteSpace(objAPIRequest.Code))
            {
                isVerified = await VerifyTotp(user, objAPIRequest.Code);
                authMethods.Add("otp");
            }
            else if (!string.IsNullOrWhiteSpace(objAPIRequest.RecoveryCode))
            {
                isVerified = await userDAL.ConsumeRecoveryCodeDB(user.Id, recoveryCodeService.Hash(objAPIRequest.RecoveryCode));
                authMethods.Add("rec");
            }
            if (!isVerified)
            {
                await userDAL.RecordFailureDB(user.Id, _security.MaxFailedAttempts, _security.LockoutMinutes);
                await auditBAL.Write("login.mfa-failed", false, user.Id, user.Email, string.Empty);
                return Fail(objResponse, ErrorCode.Unauthorized, "That code didn't work.");
            }
            if (await challengeDAL.TakeChallengeDB(claims.Value.ChallengeId, "mfa") == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Sign-in expired. Start again.");
            }
            await userDAL.RecordSuccessDB(user.Id);
            AdminUserDocument current = await userDAL.GetUserByIdDB(user.Id) ?? user;
            objResponse.Data = await sessionBAL.IssueSession(current, authMethods);
            await auditBAL.Write(authMethods.Contains("rec") ? "login.recovery-code" : "login.totp", true, user.Id, user.Email, string.Empty);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Signed in.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step VerifyMfa", string.Empty, nameof(VerifyMfa));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetSignInOptions
    // Method Description    :   Tells the sign-in page which methods are on and whether setup is still open, so it hides what doesn't apply.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetSignInOptions : </c> Tells the sign-in page which methods are on and whether setup is still open, so it hides what doesn't apply.
    /// </summary>
    public async Task<Response<object>> GetSignInOptions()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            AdminUserDocument? admin = await userDAL.GetUserByIdDB(AdminUserId);
            objResponse.Data = new SignInOptionsDTO
            {
                IsPasswordLoginEnabled = await IsPasswordLoginAllowed(),
                IsSetupAvailable = _security.SetupToken.Length >= 32 && (admin == null || !admin.IsTotpConfirmed),
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetSignInOptions", string.Empty, nameof(GetSignInOptions));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetCurrentAdmin
    // Method Description    :   Returns the signed-in admin's account summary.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :   26 Sep 2026
    // Modified Reason       :   Passkey-only switch (settings/security.IsPasswordLoginEnabled).
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Reports the passkey-only switch
    //****************************************************************************************************
    /// <summary>
    /// <c>GetCurrentAdmin : </c> Returns the signed-in admin's account summary.
    /// </summary>
    public async Task<Response<object>> GetCurrentAdmin()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            AdminUserDocument? user = await userDAL.GetUserByIdDB(contextService.GetUserId());
            if (user == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Not signed in.");
            }
            List<PasskeyDocument> passkeys = await passkeyDAL.GetPasskeysByUserDB(user.Id);
            SecuritySettingsDocument settings = await settingsDAL.GetSecuritySettingsDB();
            objResponse.Data = new AdminInfoDTO
            {
                Email = user.Email,
                LastLoginAt = user.LastLoginAt,
                PasskeyCount = passkeys.Count,
                RecoveryCodesLeft = user.RecoveryCodeHashes.Count,
                IsPasswordLoginEnabled = settings.IsPasswordLoginEnabled,
                IsPasswordLoginAllowed = settings.IsPasswordLoginEnabled || passkeys.Count == 0,
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetCurrentAdmin", string.Empty, nameof(GetCurrentAdmin));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   RegenerateRecoveryCodes
    // Method Description    :   Replaces all recovery codes after a fresh authenticator code.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RegenerateRecoveryCodes : </c> Replaces all recovery codes after a fresh authenticator code.
    /// </summary>
    public async Task<Response<object>> RegenerateRecoveryCodes(StepUpRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            AdminUserDocument? user = await VerifyStepUp(objAPIRequest.Code);
            if (user == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "That code didn't work.");
            }
            (List<string> codes, List<string> hashes) = recoveryCodeService.Generate();
            await userDAL.SetRecoveryCodesDB(user.Id, hashes);
            await auditBAL.Write("recovery-codes.regenerated", true, user.Id, user.Email, string.Empty);
            objResponse.Data = new RecoveryCodesDTO { RecoveryCodes = codes };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "New recovery codes created; the old ones no longer work.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step RegenerateRecoveryCodes", string.Empty, nameof(RegenerateRecoveryCodes));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   VerifyStepUp
    // Method Description    :   Confirms a sensitive action with a fresh TOTP code from the signed-in admin; failures count towards lockout.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   code
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   AdminUserDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>VerifyStepUp : </c> Confirms a sensitive action with a fresh TOTP code from the signed-in admin; failures count towards lockout.
    /// </summary>
    public async Task<AdminUserDocument?> VerifyStepUp(string code)
    {
        AdminUserDocument? user = await userDAL.GetUserByIdDB(contextService.GetUserId());
        if (user == null || IsLockedOut(user))
        {
            return null;
        }
        if (await VerifyTotp(user, code))
        {
            return user;
        }
        await userDAL.RecordFailureDB(user.Id, _security.MaxFailedAttempts, _security.LockoutMinutes);
        await auditBAL.Write("step-up.failed", false, user.Id, user.Email, string.Empty);
        return null;
    }

    private async Task<bool> VerifyTotp(AdminUserDocument user, string code)
    {
        string secret = secretProtector.Unprotect(user.TotpSecretProtected);
        return totpService.Verify(secret, code, user.LastTotpStep, out long step) && await userDAL.ClaimTotpStepDB(user.Id, step);
    }

    // The owner's database switch, except that it never applies while no passkey exists:
    // turning passwords off with nothing to replace them would lock the admin out.
    private async Task<bool> IsPasswordLoginAllowed()
    {
        SecuritySettingsDocument settings = await settingsDAL.GetSecuritySettingsDB();
        return settings.IsPasswordLoginEnabled || await passkeyDAL.CountPasskeysDB() == 0;
    }

    private static bool IsLockedOut(AdminUserDocument user)
    {
        return user.LockoutUntil != null && user.LockoutUntil > DateTime.UtcNow;
    }

    private static string NormalizeEmail(string email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsValidEmail(string email)
    {
        int at = email.IndexOf('@');
        return email.Length <= 254 && at > 0 && at == email.LastIndexOf('@') && email.IndexOf('.', at) > at + 1 && !email.Any(char.IsWhiteSpace);
    }

    private static bool FixedTimeEquals(string provided, string expected)
    {
        return CryptographicOperations.FixedTimeEquals(
            SHA256.HashData(Encoding.UTF8.GetBytes(provided ?? string.Empty)),
            SHA256.HashData(Encoding.UTF8.GetBytes(expected)));
    }

    private static Response<object> Fail(Response<object> objResponse, ErrorCode code, string message)
    {
        objResponse.ReturnCode = (int)code;
        objResponse.ReturnMessage = message;
        objResponse.ServerDate = DateTime.UtcNow;
        return objResponse;
    }
}
