namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A new site to add to the platform.
 */
public class ProvisionTenantRequestDTO
{
    /// <summary>The site's slug: 3–32 lower-case letters, digits and hyphens, starting with a letter.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Host names that serve it (up to 5).</summary>
    public List<string> Hosts { get; set; } = new();
}
