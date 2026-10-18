using System.Diagnostics;
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.Api.Filters;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;
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
 * Description     :  Uploads an image for blog posts (multipart form: file, width, height).
 */
[Route("api/[controller]")]
[ApiController]
[JwtAuthentication]
[EnableRateLimiting("admin")]
public class UploadImageController(MediaBAL objMediaBAL, ICodeLogger codeLog) : ControllerBase
{
    // A little over the 2 MB image limit, for the multipart envelope; every other endpoint keeps the 512 KB cap.
    private const int MaxRequestBytes = MediaBAL.MaxBytes + 64 * 1024;

    //****************************************************************************************************
    // Layer                 :   Controller
    // Method Name           :   UploadImage
    // Method Description    :   Reads the uploaded file and passes its bytes and size to MediaBAL.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   file, width, height
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   objResponse
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UploadImage : </c> Reads the uploaded file and passes its bytes and size to MediaBAL.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile? file, [FromForm] int width, [FromForm] int height)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        Response<object> objResponse = new Response<object>();
        try
        {
            if (file != null && file.Length <= MediaBAL.MaxBytes)
            {
                using MemoryStream buffer = new MemoryStream();
                await file.CopyToAsync(buffer);
                objResponse = await objMediaBAL.UploadImage(new UploadImageRequestDTO
                {
                    Content = buffer.ToArray(),
                    FileName = file.FileName,
                    Width = width,
                    Height = height,
                });
            }
            else
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = file == null ? "Choose an image to upload." : "Images are limited to 2 MB.";
            }
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, $"Step {nameof(UploadImage)}", string.Empty, $"Exception in {nameof(UploadImage)} Method");
        }
        stopwatch.Stop();
        objResponse.ResponseTime = stopwatch.ElapsedMilliseconds.ToString();
        return this.ToActionResult(objResponse);
    }
}
