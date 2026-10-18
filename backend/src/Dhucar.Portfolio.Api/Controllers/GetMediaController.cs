using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties.Documents;
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
 * Description     :  Serves uploaded images at /media/{hash}.{ext}. A name is a hash of the content, so responses are cached for a year as immutable.
 */
[ApiController]
[EnableRateLimiting("public")]
public class GetMediaController(MediaBAL objMediaBAL, ICodeLogger codeLog) : ControllerBase
{
    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   GetMedia
    // Method Description    :   Returns the image bytes with long-lived caching, or 404.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   fileName
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   File or NotFound
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetMedia : </c> Returns the image bytes with long-lived caching, or 404.
    /// </summary>
    [HttpGet("/media/{fileName}")]
    public async Task<IActionResult> GetMedia(string fileName)
    {
        try
        {
            MediaDocument? media = await objMediaBAL.GetImageFile(fileName);
            if (media == null)
            {
                return NotFound();
            }
            string etag = $"\"{media.Id}\"";
            if (Request.Headers.IfNoneMatch.ToString() == etag)
            {
                return StatusCode(StatusCodes.Status304NotModified);
            }
            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            Response.Headers.ETag = etag;
            return File(media.Data, media.ContentType);
        }
        catch (Exception ex)
        {
            codeLog.Error(ex, $"Step {nameof(GetMedia)}", string.Empty, $"Exception in {nameof(GetMedia)} Method");
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
