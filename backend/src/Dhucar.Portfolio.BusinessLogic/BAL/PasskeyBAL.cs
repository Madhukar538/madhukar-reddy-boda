using System.Text.Json;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.WebUtilities;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Passkeys (WebAuthn): registration for the signed-in admin and phishing-resistant, passwordless sign-in.
 */
public class PasskeyBAL(
    IFido2 fido2,
    PasskeyDAL passkeyDAL,
    ChallengeDAL challengeDAL,
    UserDAL userDAL,
    TokenService tokenService,
    SessionBAL sessionBAL,
    AuthBAL authBAL,
    AuditBAL auditBAL,
    IContextService contextService,
    ICodeLogger codeLog)
{
    private const int MaxPasskeys = 10;
    private const string SignInFailed = "Passkey sign-in failed.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   PasskeyRegisterOptions
    // Method Description    :   Creates registration options for the signed-in admin (user verification and a discoverable credential required).
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
    /// <c>PasskeyRegisterOptions : </c> Creates registration options for the signed-in admin (user verification and a discoverable credential required).
    /// </summary>
    public async Task<Response<object>> PasskeyRegisterOptions()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            AdminUserDocument? user = await userDAL.GetUserByIdDB(contextService.GetUserId());
            if (user == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Not signed in.");
            }
            List<PasskeyDocument> existing = await passkeyDAL.GetPasskeysByUserDB(user.Id);
            if (existing.Count >= MaxPasskeys)
            {
                return Fail(objResponse, ErrorCode.ValidationFailed, $"You can register up to {MaxPasskeys} passkeys.");
            }
            CredentialCreateOptions createOptions = fido2.RequestNewCredential(new RequestNewCredentialParams
            {
                User = new Fido2User { Id = user.UserHandle, Name = user.Email, DisplayName = user.Email },
                ExcludeCredentials = existing.Select(x => new PublicKeyCredentialDescriptor(WebEncoders.Base64UrlDecode(x.Id))).ToList(),
                AuthenticatorSelection = new AuthenticatorSelection
                {
                    ResidentKey = ResidentKeyRequirement.Required,
                    UserVerification = UserVerificationRequirement.Required,
                },
                AttestationPreference = AttestationConveyancePreference.None,
            });
            objResponse.Data = await StoreChallenge("passkey-register", user.Id, createOptions.ToJson());
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step PasskeyRegisterOptions", string.Empty, nameof(PasskeyRegisterOptions));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   PasskeyRegister
    // Method Description    :   Verifies the authenticator's response and stores the new passkey.
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
    /// <c>PasskeyRegister : </c> Verifies the authenticator's response and stores the new passkey.
    /// </summary>
    public async Task<Response<object>> PasskeyRegister(PasskeyRegisterRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        string userId = contextService.GetUserId();
        try
        {
            AuthChallengeDocument? challenge = await challengeDAL.TakeChallengeDB(objAPIRequest.ChallengeId ?? string.Empty, "passkey-register");
            if (challenge == null || challenge.UserId != userId)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Registration expired. Try again.");
            }
            AuthenticatorAttestationRawResponse? attestation = Deserialize<AuthenticatorAttestationRawResponse>(objAPIRequest.Credential);
            if (attestation == null)
            {
                return Fail(objResponse, ErrorCode.ValidationFailed, "Missing credential.");
            }
            RegisteredPublicKeyCredential credential = await fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
            {
                AttestationResponse = attestation,
                OriginalOptions = CredentialCreateOptions.FromJson(challenge.Payload),
                IsCredentialIdUniqueToUserCallback = async (args, cancellationToken) =>
                    await passkeyDAL.GetPasskeyByIdDB(WebEncoders.Base64UrlEncode(args.CredentialId)) == null,
            }, CancellationToken.None);
            string name = (objAPIRequest.Name ?? string.Empty).Trim();
            PasskeyDocument passkey = new PasskeyDocument
            {
                Id = WebEncoders.Base64UrlEncode(credential.Id),
                UserId = userId,
                Name = name.Length == 0 ? "Passkey" : name.Length > 64 ? name[..64] : name,
                PublicKey = credential.PublicKey,
                SignCount = credential.SignCount,
                Transports = credential.Transports?.Select(x => x.ToString()).ToArray() ?? [],
                IsBackedUp = credential.IsBackedUp,
                CreatedAt = DateTime.UtcNow,
            };
            await passkeyDAL.InsertPasskeyDB(passkey);
            await auditBAL.Write("passkey.registered", true, userId, contextService.GetEmail(), passkey.Name);
            objResponse.Data = ToListItem(passkey);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Passkey added.";
        }
        catch (Fido2VerificationException ex)
        {
            await auditBAL.Write("passkey.register-failed", false, userId, contextService.GetEmail(), ex.Message);
            objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
            objResponse.ReturnMessage = "The passkey couldn't be verified.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step PasskeyRegister", string.Empty, nameof(PasskeyRegister));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   PasskeyLoginOptions
    // Method Description    :   Creates sign-in options for a discoverable passkey (no email needed).
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
    /// <c>PasskeyLoginOptions : </c> Creates sign-in options for a discoverable passkey (no email needed).
    /// </summary>
    public async Task<Response<object>> PasskeyLoginOptions()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            AssertionOptions assertionOptions = fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                AllowedCredentials = [],
                UserVerification = UserVerificationRequirement.Required,
            });
            objResponse.Data = await StoreChallenge("passkey-login", string.Empty, assertionOptions.ToJson());
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step PasskeyLoginOptions", string.Empty, nameof(PasskeyLoginOptions));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   PasskeyLogin
    // Method Description    :   Verifies a passkey assertion (signature, counter, user verification) and starts the session.
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
    /// <c>PasskeyLogin : </c> Verifies a passkey assertion (signature, counter, user verification) and starts the session.
    /// </summary>
    public async Task<Response<object>> PasskeyLogin(PasskeyLoginRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        AdminUserDocument? user = null;
        try
        {
            AuthChallengeDocument? challenge = await challengeDAL.TakeChallengeDB(objAPIRequest.ChallengeId ?? string.Empty, "passkey-login");
            AuthenticatorAssertionRawResponse? assertion = Deserialize<AuthenticatorAssertionRawResponse>(objAPIRequest.Credential);
            if (challenge == null || assertion == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Sign-in expired. Try again.");
            }
            PasskeyDocument? passkey = await passkeyDAL.GetPasskeyByIdDB(WebEncoders.Base64UrlEncode(assertion.RawId ?? []));
            user = passkey == null ? null : await userDAL.GetUserByIdDB(passkey.UserId);
            if (passkey == null || user == null)
            {
                await auditBAL.Write("login.passkey-failed", false, string.Empty, string.Empty, "unknown credential");
                return Fail(objResponse, ErrorCode.Unauthorized, SignInFailed);
            }
            // No lockout check here on purpose: a passkey can't be brute-forced (every attempt needs a signature from
            // the private key), and honouring the password lockout would let anyone spamming Login lock the admin out.
            AdminUserDocument owner = user;
            VerifyAssertionResult result = await fido2.MakeAssertionAsync(new MakeAssertionParams
            {
                AssertionResponse = assertion,
                OriginalOptions = AssertionOptions.FromJson(challenge.Payload),
                StoredPublicKey = passkey.PublicKey,
                StoredSignatureCounter = (uint)passkey.SignCount,
                IsUserHandleOwnerOfCredentialIdCallback = (args, cancellationToken) => Task.FromResult(
                    args.UserHandle.AsSpan().SequenceEqual(owner.UserHandle) &&
                    WebEncoders.Base64UrlEncode(args.CredentialId) == passkey.Id),
            }, CancellationToken.None);
            await passkeyDAL.UpdatePasskeyUsageDB(passkey.Id, result.SignCount, result.IsBackedUp);
            AdminUserDocument current = await userDAL.GetUserByIdDB(user.Id) ?? user;
            objResponse.Data = await sessionBAL.IssueSession(current, ["hwk"]);
            await auditBAL.Write("login.passkey", true, user.Id, user.Email, passkey.Name);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Signed in.";
        }
        catch (Fido2VerificationException ex)
        {
            await auditBAL.Write("login.passkey-failed", false, user?.Id ?? string.Empty, user?.Email ?? string.Empty, ex.Message);
            objResponse.ReturnCode = (int)ErrorCode.Unauthorized;
            objResponse.ReturnMessage = SignInFailed;
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step PasskeyLogin", string.Empty, nameof(PasskeyLogin));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPasskeys
    // Method Description    :   Lists the signed-in admin's passkeys (no key material).
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
    /// <c>GetPasskeys : </c> Lists the signed-in admin's passkeys (no key material).
    /// </summary>
    public async Task<Response<object>> GetPasskeys()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<PasskeyListDTO> passkeys = (await passkeyDAL.GetPasskeysByUserDB(contextService.GetUserId())).Select(ToListItem).ToList();
            objResponse.Data = passkeys;
            objResponse.RowCount = passkeys.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPasskeys", string.Empty, nameof(GetPasskeys));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   DeletePasskey
    // Method Description    :   Removes a passkey after a fresh authenticator code.
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
    /// <c>DeletePasskey : </c> Removes a passkey after a fresh authenticator code.
    /// </summary>
    public async Task<Response<object>> DeletePasskey(DeletePasskeyRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            AdminUserDocument? user = await authBAL.VerifyStepUp(objAPIRequest.Code);
            if (user == null)
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "That code didn't work.");
            }
            if (!await passkeyDAL.DeletePasskeyDB(objAPIRequest.Id ?? string.Empty, user.Id))
            {
                return Fail(objResponse, ErrorCode.NotFound, "Passkey not found.");
            }
            await auditBAL.Write("passkey.deleted", true, user.Id, user.Email, objAPIRequest.Id ?? string.Empty);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Passkey removed.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step DeletePasskey", string.Empty, nameof(DeletePasskey));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private async Task<PasskeyOptionsDTO> StoreChallenge(string kind, string userId, string optionsJson)
    {
        string challengeId = tokenService.NewOpaqueToken();
        await challengeDAL.InsertChallengeDB(new AuthChallengeDocument
        {
            Id = challengeId,
            Kind = kind,
            UserId = userId,
            Payload = optionsJson,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
        });
        using JsonDocument document = JsonDocument.Parse(optionsJson);
        return new PasskeyOptionsDTO { ChallengeId = challengeId, Options = document.RootElement.Clone() };
    }

    private static T? Deserialize<T>(JsonElement element) where T : class
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }
        try
        {
            return JsonSerializer.Deserialize<T>(element.GetRawText());
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static PasskeyListDTO ToListItem(PasskeyDocument passkey)
    {
        return new PasskeyListDTO
        {
            Id = passkey.Id,
            Name = passkey.Name,
            CreatedAt = passkey.CreatedAt,
            LastUsedAt = passkey.LastUsedAt,
            IsBackedUp = passkey.IsBackedUp,
        };
    }

    private static Response<object> Fail(Response<object> objResponse, ErrorCode code, string message)
    {
        objResponse.ReturnCode = (int)code;
        objResponse.ReturnMessage = message;
        objResponse.ServerDate = DateTime.UtcNow;
        return objResponse;
    }
}
