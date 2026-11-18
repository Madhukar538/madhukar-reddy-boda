using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A standalone page made in the admin, served at /<slug> once published.
 */
[BsonIgnoreExtraElements]
public class PageDocument
{
    /// <summary>The page's address, e.g. "uses" for /uses.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>The page's heading and title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>A sentence under the heading, also used for search engines and link previews.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>The body as sanitized HTML.</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Shown on the site; drafts are visible only in the admin.</summary>
    public bool IsPublished { get; set; }

    /// <summary>UTC time it was first saved.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time it was last saved.</summary>
    public DateTime UpdatedAt { get; set; }
}
