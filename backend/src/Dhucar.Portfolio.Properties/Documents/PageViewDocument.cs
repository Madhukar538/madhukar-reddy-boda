using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One anonymous page view. No IP address, cookie or user id is stored.
 */
[BsonIgnoreExtraElements]
public class PageViewDocument
{
    /// <summary>Entry id (ObjectId string).</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>UTC time of the view; a TTL index enforces retention.</summary>
    public DateTime Timestamp { get; set; }

    /// <summary>UTC day, yyyy-MM-dd.</summary>
    public string Day { get; set; } = string.Empty;

    /// <summary>Page path without query string.</summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>Referring host only, or empty.</summary>
    public string ReferrerHost { get; set; } = string.Empty;

    /// <summary>utm_source campaign tag, if any.</summary>
    public string UtmSource { get; set; } = string.Empty;

    /// <summary>desktop, mobile or tablet.</summary>
    public string Device { get; set; } = string.Empty;

    /// <summary>Two-letter country from the CDN, if available.</summary>
    public string Country { get; set; } = string.Empty;

    /// <summary>Daily-salted hash for counting unique visitors; the salt is deleted after two days.</summary>
    public string VisitorHash { get; set; } = string.Empty;
}
