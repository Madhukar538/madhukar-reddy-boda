using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Images for blog posts: validated by their bytes (PNG, JPEG, WebP or GIF only), stored by content hash, listed and deleted in the admin, and served to the site.
 */
public partial class MediaBAL(MediaDAL mediaDAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    /// <summary>Largest image accepted (the admin resizes and compresses before uploading).</summary>
    public const int MaxBytes = 2 * 1024 * 1024;

    private static readonly Dictionary<string, string> Extensions = new()
    {
        ["image/webp"] = "webp",
        ["image/png"] = "png",
        ["image/jpeg"] = "jpg",
        ["image/gif"] = "gif",
    };

    [GeneratedRegex("^([a-f0-9]{32})\\.(webp|png|jpg|gif)$")]
    private static partial Regex MediaFileName();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   UploadImage
    // Method Description    :   Validates an image by its bytes and size, stores it under a hash of its content, and returns the URL to use in posts. Uploading the same image again returns the existing one.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UploadImage : </c> Validates an image by its bytes and size, stores it under a hash of its content, and returns the URL to use in posts. Uploading the same image again returns the existing one.
    /// </summary>
    public async Task<Response<object>> UploadImage(UploadImageRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            byte[] content = objAPIRequest.Content ?? [];
            string contentType = SniffImageType(content);
            string error = content.Length == 0 ? "Choose an image to upload."
                : content.Length > MaxBytes ? "Images are limited to 2 MB."
                : contentType.Length == 0 ? "Only PNG, JPEG, WebP and GIF images can be uploaded."
                : objAPIRequest.Width is < 1 or > 10_000 || objAPIRequest.Height is < 1 or > 10_000 ? "Image size is missing or invalid."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            string mediaId = Convert.ToHexString(SHA256.HashData(content), 0, 16).ToLowerInvariant();
            string name = Path.GetFileName((objAPIRequest.FileName ?? string.Empty).Trim());
            MediaDocument media = new MediaDocument
            {
                Id = mediaId,
                ContentType = contentType,
                Name = name.Length > 120 ? name[..120] : name,
                Width = objAPIRequest.Width,
                Height = objAPIRequest.Height,
                Bytes = content.Length,
                UploadedBy = contextService.GetEmail(),
                UploadedAt = DateTime.UtcNow,
                Data = content,
            };
            bool isNew = await mediaDAL.InsertMediaDB(media);
            if (isNew)
            {
                await auditBAL.Write("media.uploaded", true, contextService.GetUserId(), contextService.GetEmail(), $"{mediaId} ({content.Length:N0} bytes)");
            }
            MediaDocument stored = isNew ? media : (await mediaDAL.GetMediaInfoDB(mediaId))!;
            objResponse.Data = ToItem(stored);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = isNew ? "Image uploaded." : "This image was already uploaded.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step UploadImage", string.Empty, nameof(UploadImage));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetImages
    // Method Description    :   One page of uploaded images, newest first, without their bytes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetImages : </c> One page of uploaded images, newest first, without their bytes.
    /// </summary>
    public async Task<Response<object>> GetImages(GetImagesRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            (int page, int pageSize, int skip) = Paging.Normalize(objAPIRequest);
            string search = (objAPIRequest.Search ?? string.Empty).Trim();
            (List<MediaDocument> items, long total) = await mediaDAL.GetMediaPageDB(search.Length > 100 ? search[..100] : search, skip, pageSize);
            objResponse.Data = Paging.Result(items.Select(ToItem).ToList(), page, pageSize, total);
            objResponse.RowCount = total;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetImages", string.Empty, nameof(GetImages));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   DeleteImage
    // Method Description    :   Deletes an uploaded image (posts that still use it will show a broken image).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteImage : </c> Deletes an uploaded image (posts that still use it will show a broken image).
    /// </summary>
    public async Task<Response<object>> DeleteImage(DeleteItemRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string mediaId = (objAPIRequest.Id ?? string.Empty).Trim().ToLowerInvariant();
            bool isDeleted = mediaId.Length == 32 && await mediaDAL.DeleteMediaDB(mediaId);
            if (!isDeleted)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Image not found.";
                return objResponse;
            }
            await auditBAL.Write("media.deleted", true, contextService.GetUserId(), contextService.GetEmail(), mediaId);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Image deleted.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step DeleteImage", string.Empty, nameof(DeleteImage));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetImageFile
    // Method Description    :   Finds the image for a public /media/{hash}.{ext} URL; null when the name is malformed, unknown, or its extension doesn’t match the stored type.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   fileName
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   MediaDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetImageFile : </c> Finds the image for a public /media/{hash}.{ext} URL; null when the name is malformed, unknown, or its extension doesn’t match the stored type.
    /// </summary>
    public async Task<MediaDocument?> GetImageFile(string fileName)
    {
        Match match = MediaFileName().Match(fileName ?? string.Empty);
        if (!match.Success)
        {
            return null;
        }
        MediaDocument? media = await mediaDAL.GetMediaDB(match.Groups[1].Value);
        return media != null && Extensions.GetValueOrDefault(media.ContentType) == match.Groups[2].Value ? media : null;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SniffImageType
    // Method Description    :   The image type from the file’s first bytes (never from its name or the browser’s claim); empty when it isn’t PNG, JPEG, WebP or GIF.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   content
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SniffImageType : </c> The image type from the file’s first bytes (never from its name or the browser’s claim); empty when it isn’t PNG, JPEG, WebP or GIF.
    /// </summary>
    public static string SniffImageType(byte[] content)
    {
        ReadOnlySpan<byte> bytes = content;
        if (bytes.Length >= 12 && bytes[..4].SequenceEqual("RIFF"u8) && bytes[8..12].SequenceEqual("WEBP"u8))
        {
            return "image/webp";
        }
        if (bytes.Length >= 8 && bytes[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
        {
            return "image/png";
        }
        if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
        {
            return "image/jpeg";
        }
        if (bytes.Length >= 6 && (bytes[..6].SequenceEqual("GIF87a"u8) || bytes[..6].SequenceEqual("GIF89a"u8)))
        {
            return "image/gif";
        }
        return string.Empty;
    }

    private static MediaItemDTO ToItem(MediaDocument x)
    {
        return new MediaItemDTO
        {
            Id = x.Id,
            Url = $"/media/{x.Id}.{Extensions.GetValueOrDefault(x.ContentType, "bin")}",
            ContentType = x.ContentType,
            Name = x.Name,
            Width = x.Width,
            Height = x.Height,
            Bytes = x.Bytes,
            UploadedBy = x.UploadedBy,
            UploadedAt = x.UploadedAt,
        };
    }
}
