namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  An uploaded image as listed in the admin, with the URL to use in posts.
 */
public class MediaItemDTO
{
    /// <summary>Content hash.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Site-relative URL, e.g. /media/abc.webp.</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>image/webp, image/png, image/jpeg or image/gif (from the file bytes, not the upload).</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>Original file name, for the media list.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Width in pixels.</summary>
    public int Width { get; set; }

    /// <summary>Height in pixels.</summary>
    public int Height { get; set; }

    /// <summary>File size.</summary>
    public long Bytes { get; set; }

    /// <summary>Admin email.</summary>
    public string UploadedBy { get; set; } = string.Empty;

    /// <summary>UTC upload time.</summary>
    public DateTime UploadedAt { get; set; }
}
