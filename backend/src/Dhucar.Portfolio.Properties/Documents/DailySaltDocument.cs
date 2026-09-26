using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Random salt for one day of visitor hashes; expires so hashes cannot be reversed later.
 */
[BsonIgnoreExtraElements]
public class DailySaltDocument
{
    /// <summary>UTC day, yyyy-MM-dd.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Base64 random salt.</summary>
    public string Salt { get; set; } = string.Empty;

    /// <summary>UTC creation; TTL index removes it after two days.</summary>
    public DateTime CreatedAt { get; set; }
}
