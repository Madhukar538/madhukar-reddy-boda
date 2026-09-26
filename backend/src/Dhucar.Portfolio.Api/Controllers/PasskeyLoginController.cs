using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;
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
 * Description     :  Verifies a passkey assertion and starts the session.
 */
[Route("api/[controller]")]
[ApiController]
[EnableRateLimiting("auth")]
public class PasskeyLoginController(PasskeyBAL objPasskeyBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   PasskeyLogin
    // Method Description    :   Verifies a passkey assertion and starts the session.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>PasskeyLogin : </c> Verifies a passkey assertion and starts the session.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> PasskeyLogin([FromBody] PasskeyLoginRequestDTO objAPIRequest)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            if (objAPIRequest != null)
            {
                objResponse = await objPasskeyBAL.PasskeyLogin(objAPIRequest);
            }
            else
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Missing Parameters.";
            }
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(PasskeyLogin)}", string.Empty, $"Exception in {nameof(PasskeyLogin)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
