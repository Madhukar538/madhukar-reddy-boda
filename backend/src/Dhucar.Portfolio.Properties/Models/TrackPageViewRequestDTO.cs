namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  An anonymous page view sent by the site.
 */
public class TrackPageViewRequestDTO
{
    /// <summary>Page path.</summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>document.referrer.</summary>
    public string Referrer { get; set; } = string.Empty;

    /// <summary>utm_source query value.</summary>
    public string UtmSource { get; set; } = string.Empty;
}
