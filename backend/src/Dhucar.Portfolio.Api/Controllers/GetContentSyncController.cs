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
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Controller
 * Modified By     :
 * Description     :  Lists what is new or changed in the built-in content compared with the database.
 */
[Route("api/[controller]")]
[ApiController]
[JwtAuthentication]
[EnableRateLimiting("admin")]
public class GetContentSyncController(ContentSyncBAL objContentSyncBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   GetContentSync
    // Method Description    :   Lists what is new or changed in the built-in content compared with the database.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetContentSync : </c> Lists what is new or changed in the built-in content compared with the database.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> GetContentSync()
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            objResponse = await objContentSyncBAL.GetContentSync();
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(GetContentSync)}", string.Empty, $"Exception in {nameof(GetContentSync)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
