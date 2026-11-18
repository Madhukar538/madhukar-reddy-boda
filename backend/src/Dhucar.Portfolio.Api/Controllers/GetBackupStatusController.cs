using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.Api.Filters;
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
 * Description     :  Returns how the backups stand: the last attempt, the last restore-checked dump and the offsite copy.
 */
[Route("api/[controller]")]
[ApiController]
[JwtAuthentication]
[EnableRateLimiting("admin")]
public class GetBackupStatusController(BackupBAL objBackupBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   GetBackupStatus
    // Method Description    :   Returns how the backups stand: the last attempt, the last restore-checked dump and the offsite copy.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetBackupStatus : </c> Returns how the backups stand: the last attempt, the last restore-checked dump and the offsite copy.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> GetBackupStatus()
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            objResponse = await objBackupBAL.GetBackupStatus();
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(GetBackupStatus)}", string.Empty, $"Exception in {nameof(GetBackupStatus)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
