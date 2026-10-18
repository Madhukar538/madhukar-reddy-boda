using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A reader comment on a post; shown only once approved. No IP or email is stored.
 */
[BsonIgnoreExtraElements]
public class CommentDocument
{
    /// <summary>Comment id.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Name the reader gave.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Comment text (plain text, never HTML).</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>pending, approved or spam.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>CDN-reported two-letter country, for moderation context.</summary>
    public string Country { get; set; } = string.Empty;

    /// <summary>UTC time it was posted.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time it was approved.</summary>
    public DateTime? ApprovedAt { get; set; }
}
