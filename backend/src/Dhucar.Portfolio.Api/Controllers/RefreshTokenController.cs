using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Dhucar.Portfolio.Api.Controllers;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  26 Sep 2026
 * Modified Reason :  Admin-level rate limit: each page load renews the session, and the cookie can't be guessed.
 * Layer           :  Controller
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Rotates the refresh cookie and returns a new access token.
 */
[Route("api/[controller]")]
[ApiController]
// Not the strict sign-in limit: the refresh cookie holds 256 random bits, so there is nothing
// to brute-force, and the admin renews its session on every page load.
[EnableRateLimiting("admin")]
public class RefreshTokenController(SessionBAL objSessionBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   RefreshToken
    // Method Description    :   Rotates the refresh cookie and returns a new access token.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :   26 Sep 2026
    // Modified Reason       :   Admin-level rate limit: each page load renews the session, and the cookie can't be guessed.
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Admin-level rate limit
    //****************************************************************************************************
    /// <summary>
    /// <c>RefreshToken : </c> Rotates the refresh cookie and returns a new access token.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> RefreshToken()
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            objResponse = await objSessionBAL.RefreshSession();
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(RefreshToken)}", string.Empty, $"Exception in {nameof(RefreshToken)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
