using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A blog post.
 */
[BsonIgnoreExtraElements]
public class PostDocument
{
    /// <summary>URL slug.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Post title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Short summary for cards and metadata.</summary>
    public string Excerpt { get; set; } = string.Empty;

    /// <summary>Sanitised HTML body.</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Display date, e.g. "September 26, 2026".</summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>UTC publish date used for ordering.</summary>
    public DateTime PublishedAt { get; set; }

    /// <summary>Primary category.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Tags.</summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>Only published posts are served publicly.</summary>
    public bool IsPublished { get; set; }

    /// <summary>UTC last update.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>Email of the admin who last saved it.</summary>
    public string UpdatedBy { get; set; } = string.Empty;
}
