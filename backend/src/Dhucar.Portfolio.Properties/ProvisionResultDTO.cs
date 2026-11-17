namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A new site: its slug and its own setup token (shown only now; only its hash is stored).
 */
public class ProvisionResultDTO
{
    /// <summary>The site's slug.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>The token that creates the site's first admin (SetupAdmin with X-Tenant naming the site).</summary>
    public string SetupToken { get; set; } = string.Empty;
}
