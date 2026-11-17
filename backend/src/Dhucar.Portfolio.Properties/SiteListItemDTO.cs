namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A site on the platform, as listed in the primary admin (never its setup token or hash).
 */
public class SiteListItemDTO
{
    /// <summary>The site's slug.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Host names that serve it.</summary>
    public List<string> Hosts { get; set; } = new();

    /// <summary>active or suspended.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>UTC time it was created.</summary>
    public DateTime CreatedAt { get; set; }
}
