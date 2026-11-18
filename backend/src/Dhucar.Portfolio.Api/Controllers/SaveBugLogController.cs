using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.Api.Filters;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Dhucar.Portfolio.Api.Controllers;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Controller
 * Modified By     :
 * Description     :  Saves the site's whole bug log.
 */
[Route("api/[controller]")]
[ApiController]
[JwtAuthentication]
[EnableRateLimiting("admin")]
public class SaveBugLogController(BugLogBAL objBugLogBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   SaveBugLog
    // Method Description    :   Saves the site's whole bug log.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SaveBugLog : </c> Saves the site's whole bug log.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SaveBugLog([FromBody] SaveBugLogRequestDTO objAPIRequest)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            if (objAPIRequest != null)
            {
                objResponse = await objBugLogBAL.SaveBugLog(objAPIRequest);
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
            codeLog.Error(ex, $"Step {nameof(SaveBugLog)}", string.Empty, $"Exception in {nameof(SaveBugLog)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
