using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Dhucar.Portfolio.Api.Controllers;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Controller
 * Modified By     :
 * Description     :  Lists the admin passkeys.
 */
[Route("api/[controller]")]
[ApiController]
[JwtAuthentication]
[EnableRateLimiting("admin")]
public class GetPasskeysController(PasskeyBAL objPasskeyBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   GetPasskeys
    // Method Description    :   Lists the admin passkeys.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPasskeys : </c> Lists the admin passkeys.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> GetPasskeys()
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            objResponse = await objPasskeyBAL.GetPasskeys();
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(GetPasskeys)}", string.Empty, $"Exception in {nameof(GetPasskeys)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
