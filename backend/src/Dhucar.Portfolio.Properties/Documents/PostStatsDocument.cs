using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Lasting engagement counters for one post: reads and reactions. No visitor data.
 */
[BsonIgnoreExtraElements]
public class PostStatsDocument
{
    /// <summary>Post slug.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Page views of the post, kept after raw page views expire.</summary>
    public long Reads { get; set; }

    /// <summary>Count per reaction key (like, idea, fire, love).</summary>
    public Dictionary<string, long> Reactions { get; set; } = new();

    /// <summary>UTC time of the last change.</summary>
    public DateTime UpdatedAt { get; set; }
}
