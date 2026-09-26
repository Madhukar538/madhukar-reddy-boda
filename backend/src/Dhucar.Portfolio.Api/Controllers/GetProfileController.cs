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
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Controller
 * Modified By     :
 * Description     :  Returns the profile.
 */
[Route("api/[controller]")]
[ApiController]
[EnableRateLimiting("public")]
public class GetProfileController(ProfileBAL objProfileBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   GetProfile
    // Method Description    :   Returns the profile.
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
    /// <c>GetProfile : </c> Returns the profile.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> GetProfile()
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            objResponse = await objProfileBAL.GetProfile();
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(GetProfile)}", string.Empty, $"Exception in {nameof(GetProfile)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
