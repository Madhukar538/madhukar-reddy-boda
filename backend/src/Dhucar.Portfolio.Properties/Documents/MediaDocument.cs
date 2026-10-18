using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  An uploaded image, stored with its bytes and named by a hash of its content (so it never changes and is cached for good).
 */
[BsonIgnoreExtraElements]
public class MediaDocument
{
    /// <summary>First 32 hex characters of the SHA-256 of the bytes.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

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

    /// <summary>The image bytes (at most 2 MB).</summary>
    public byte[] Data { get; set; } = Array.Empty<byte>();
}
