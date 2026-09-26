namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Views and visitors for one day.
 */
public class DailyTrafficDTO
{
    /// <summary>UTC day, yyyy-MM-dd.</summary>
    public string Day { get; set; } = string.Empty;

    /// <summary>Page views.</summary>
    public long PageViews { get; set; }

    /// <summary>Unique visitors.</summary>
    public long Visitors { get; set; }
}
