using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A site on the platform (the registry lives in the primary database). The primary site is not
 *                    listed: it is what every request gets when it names no other site.
 */
[BsonIgnoreExtraElements]
public class TenantDocument
{
    /// <summary>The site's slug: lower-case letters, digits and hyphens (e.g. "asha").</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Host names that serve this site (e.g. "asha.example.com"), lower case.</summary>
    public List<string> Hosts { get; set; } = new();

    /// <summary>The MongoDB database holding this site's data ("site_" + slug).</summary>
    public string Database { get; set; } = string.Empty;

    /// <summary>active or suspended; a suspended site answers like an unknown one.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>UTC time it was created.</summary>
    public DateTime CreatedAt { get; set; }
}
