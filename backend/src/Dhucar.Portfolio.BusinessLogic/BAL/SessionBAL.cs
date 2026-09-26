using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Sessions: issues access tokens and rotating refresh tokens, detects refresh-token reuse, and signs out.
 */
public class SessionBAL(
    RefreshTokenDAL refreshTokenDAL,
    UserDAL userDAL,
    TokenService tokenService,
    IContextService contextService,
    AuditBAL auditBAL,
    IOptions<PortfolioSettings> options,
    ICodeLogger codeLog)
{
    // Browsers only send this custom header from scripts the CORS policy allows, which blocks cross-site refresh attempts.
    private const string CsrfHeaderName = "X-Requested-With";
    private const string CsrfHeaderValue = "dhucar-admin";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   IssueSession
    // Method Description    :   Starts a session: new refresh-token family plus an access token.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   user, authMethods
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   AuthTokenDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>IssueSession : </c> Starts a session: new refresh-token family plus an access token.
    /// </summary>
    public async Task<AuthTokenDTO> IssueSession(AdminUserDocument user, List<string> authMethods)
    {
        string familyId = Guid.NewGuid().ToString("N");
        return await IssueTokens(user, authMethods, familyId);
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   RefreshSession
    // Method Description    :   Rotates the refresh token from the cookie; a reused token revokes the whole session.
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
    /// <c>RefreshSession : </c> Rotates the refresh token from the cookie; a reused token revokes the whole session.
    /// </summary>
    public async Task<Response<object>> RefreshSession()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            if (contextService.GetHeader(CsrfHeaderName) != CsrfHeaderValue)
            {
                return Fail(objResponse, ErrorCode.Forbidden, "Missing request header.");
            }
            string rawToken = contextService.GetRefreshCookie();
            if (string.IsNullOrEmpty(rawToken))
            {
                return Fail(objResponse, ErrorCode.Unauthorized, "Not signed in.");
            }
            string tokenHash = tokenService.HashOpaqueToken(rawToken);
            RefreshTokenDocument? stored = await refreshTokenDAL.GetRefreshTokenDB(tokenHash);
            if (stored == null)
            {
                contextService.ClearRefreshCookie();
                return Fail(objResponse, ErrorCode.Unauthorized, "Session expired.");
            }
            bool isClaimed = await refreshTokenDAL.MarkRefreshTokenUsedDB(tokenHash);
            if (!isClaimed)
            {
                if (stored.RevokedAt != null)
                {
                    // A rotated token came back: assume it was stolen and end that whole session.
                    await refreshTokenDAL.RevokeFamilyDB(stored.FamilyId);
                    await auditBAL.Write("session.refresh-reuse", false, stored.UserId, string.Empty, $"family {stored.FamilyId}");
                }
                contextService.ClearRefreshCookie();
                return Fail(objResponse, ErrorCode.Unauthorized, "Session expired.");
            }
            AdminUserDocument? user = await userDAL.GetUserByIdDB(stored.UserId);
            if (user == null)
            {
                contextService.ClearRefreshCookie();
                return Fail(objResponse, ErrorCode.Unauthorized, "Session expired.");
            }
            List<string> authMethods = stored.AuthMethods.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            objResponse.Data = await IssueTokens(user, authMethods, stored.FamilyId);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step RefreshSession", string.Empty, nameof(RefreshSession));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   EndSession
    // Method Description    :   Signs out this session, or every session and every access token.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   isAllSessions
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>EndSession : </c> Signs out this session, or every session and every access token.
    /// </summary>
    public async Task<Response<object>> EndSession(bool isAllSessions)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string userId = contextService.GetUserId();
            string sessionId = contextService.GetClaim("sid");
            if (isAllSessions)
            {
                await refreshTokenDAL.RevokeAllForUserDB(userId);
                await userDAL.SetSecurityStampDB(userId, tokenService.NewOpaqueToken());
            }
            else if (sessionId.Length > 0)
            {
                await refreshTokenDAL.RevokeFamilyDB(sessionId);
            }
            contextService.ClearRefreshCookie();
            await auditBAL.Write(isAllSessions ? "session.logout-all" : "session.logout", true, userId, contextService.GetEmail(), string.Empty);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Signed out.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step EndSession", string.Empty, nameof(EndSession));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private async Task<AuthTokenDTO> IssueTokens(AdminUserDocument user, List<string> authMethods, string familyId)
    {
        SecuritySettings settings = options.Value.Security;
        (string accessToken, DateTime expiresAt) = tokenService.CreateAccessToken(user.Id, user.Email, user.SecurityStamp, authMethods, familyId);
        string refreshToken = tokenService.NewOpaqueToken();
        DateTime refreshExpiresAt = DateTime.UtcNow.AddDays(settings.RefreshTokenDays);
        await refreshTokenDAL.InsertRefreshTokenDB(new RefreshTokenDocument
        {
            Id = tokenService.HashOpaqueToken(refreshToken),
            FamilyId = familyId,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = refreshExpiresAt,
            AuthMethods = string.Join(',', authMethods),
        });
        contextService.SetRefreshCookie(refreshToken, refreshExpiresAt);
        return new AuthTokenDTO
        {
            AccessToken = accessToken,
            ExpiresAt = expiresAt,
            Email = user.Email,
            AuthMethods = authMethods,
            RecoveryCodesLeft = user.RecoveryCodeHashes.Count,
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
