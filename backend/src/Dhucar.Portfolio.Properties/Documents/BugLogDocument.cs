using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The site's public bug log: the fixed bugs, newest first; one document per site.
 */
[BsonIgnoreExtraElements]
public class BugLogDocument
{
    /// <summary>The single document's id.</summary>
    public const string DocumentId = "bugLog";

    /// <summary>Always "bugLog".</summary>
    [BsonId]
    public string Id { get; set; } = DocumentId;

    /// <summary>The entries, in the order shown (newest first).</summary>
    public List<BugEntryDocument> Entries { get; set; } = new();

    /// <summary>UTC time of the last save.</summary>
    public DateTime UpdatedAt { get; set; }
}
