using Dhucar.Portfolio.Properties;
using Microsoft.AspNetCore.Mvc;

namespace Dhucar.Portfolio.Api.Extensions;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Extensions
 * Modified By     :
 * Description     :  Maps the envelope's ReturnCode to an HTTP status code.
 */
public static class ResponseExtensions
{
    //****************************************************************************************************
    // Layer                 :   Extensions
    // Method Name           :   ToActionResult
    // Method Description    :   Returns the envelope with the matching status code.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   controller, objResponse
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   IActionResult
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ToActionResult : </c> Returns the envelope with the matching status code.
    /// </summary>
    public static IActionResult ToActionResult(this ControllerBase controller, Response<object> objResponse)
    {
        int statusCode = (ErrorCode)objResponse.ReturnCode switch
        {
            ErrorCode.Success => StatusCodes.Status200OK,
            ErrorCode.ValidationFailed => StatusCodes.Status400BadRequest,
            ErrorCode.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorCode.Forbidden => StatusCodes.Status403Forbidden,
            ErrorCode.LockedOut => StatusCodes.Status429TooManyRequests,
            ErrorCode.NotFound => StatusCodes.Status404NotFound,
            ErrorCode.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError,
        };
        return controller.StatusCode(statusCode, objResponse);
    }
}
