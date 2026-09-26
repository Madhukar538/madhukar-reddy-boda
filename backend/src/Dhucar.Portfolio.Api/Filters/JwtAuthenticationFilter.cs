using System.Security.Claims;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Dhucar.Portfolio.Api.Filters;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Filters
 * Modified By     :
 * Description     :  Validates the bearer access token and the account's security stamp, then sets HttpContext.User.
 */
public class JwtAuthenticationFilter(TokenService tokenService, UserDAL userDAL) : IAsyncAuthorizationFilter
{
    //****************************************************************************************************
    // Layer                 :   Filters
    // Method Name           :   OnAuthorizationAsync
    // Method Description    :   Rejects the request with 401 unless the token is valid and not revoked by a stamp change.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   context
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>OnAuthorizationAsync : </c> Rejects the request with 401 unless the token is valid and not revoked by a stamp change.
    /// </summary>
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        string header = context.HttpContext.Request.Headers.Authorization.ToString();
        string token = header.StartsWith("Bearer ", StringComparison.Ordinal) ? header["Bearer ".Length..].Trim() : string.Empty;
        ClaimsIdentity? identity = token.Length > 0 ? await tokenService.ValidateAccessToken(token) : null;
        string userId = identity?.FindFirst("sub")?.Value ?? string.Empty;
        AdminUserDocument? user = userId.Length > 0 ? await userDAL.GetUserByIdDB(userId) : null;
        if (identity == null || user == null || identity.FindFirst("stamp")?.Value != user.SecurityStamp)
        {
            context.Result = new ObjectResult(new Response<object>
            {
                ReturnCode = (int)ErrorCode.Unauthorized,
                ReturnMessage = "Not signed in.",
                ServerDate = DateTime.UtcNow,
            })
            { StatusCode = StatusCodes.Status401Unauthorized };
            return;
        }
        context.HttpContext.User = new ClaimsPrincipal(identity);
    }
}
