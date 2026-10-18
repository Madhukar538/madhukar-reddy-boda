using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Dhucar.Portfolio.Api.Controllers;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Controller
 * Modified By     :
 * Description     :  Adds or updates the chosen items from the built-in content.
 */
[Route("api/[controller]")]
[ApiController]
[JwtAuthentication]
[EnableRateLimiting("admin")]
public class ApplyContentSyncController(ContentSyncBAL objContentSyncBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   ApplyContentSync
    // Method Description    :   Adds or updates the chosen items from the built-in content.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ApplyContentSync : </c> Adds or updates the chosen items from the built-in content.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ApplyContentSync([FromBody] ApplyContentSyncRequestDTO objAPIRequest)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            if (objAPIRequest != null)
            {
                objResponse = await objContentSyncBAL.ApplyContentSync(objAPIRequest);
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
            codeLog.Error(ex, $"Step {nameof(ApplyContentSync)}", string.Empty, $"Exception in {nameof(ApplyContentSync)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
