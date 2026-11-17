using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The site's Editorial homepage story (hero, running band, chapters and exhibits) as JSON; one per site.
 */
[BsonIgnoreExtraElements]
public class StoryDocument
{
    /// <summary>The single document's id.</summary>
    public const string DocumentId = "story";

    /// <summary>Always "story".</summary>
    [BsonId]
    public string Id { get; set; } = DocumentId;

    /// <summary>The story as JSON (the site validates its shape before showing it).</summary>
    public string Json { get; set; } = string.Empty;

    /// <summary>UTC time of the last save.</summary>
    public DateTime UpdatedAt { get; set; }
}
