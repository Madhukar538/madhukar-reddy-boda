namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  An image upload (read from the multipart form by the controller).
 */
public class UploadImageRequestDTO
{
    /// <summary>File bytes.</summary>
    public byte[] Content { get; set; } = Array.Empty<byte>();

    /// <summary>Original file name.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Width in pixels, measured by the browser.</summary>
    public int Width { get; set; }

    /// <summary>Height in pixels, measured by the browser.</summary>
    public int Height { get; set; }
}
