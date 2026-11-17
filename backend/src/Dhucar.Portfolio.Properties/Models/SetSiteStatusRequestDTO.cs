namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Suspends or reactivates a site.
 */
public class SetSiteStatusRequestDTO
{
    /// <summary>The site's slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>active or suspended.</summary>
    public string Status { get; set; } = string.Empty;
}
