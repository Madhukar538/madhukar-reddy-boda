namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Traffic totals and breakdowns for a window.
 */
public class TrafficSummaryDTO
{
    /// <summary>Window length in days.</summary>
    public int Days { get; set; }

    /// <summary>Total page views.</summary>
    public long PageViews { get; set; }

    /// <summary>Unique visitors (per day, summed).</summary>
    public long Visitors { get; set; }

    /// <summary>Views and visitors per day.</summary>
    public List<DailyTrafficDTO> Daily { get; set; } = new();

    /// <summary>Most viewed paths.</summary>
    public List<CountItemDTO> TopPages { get; set; } = new();

    /// <summary>Top referring hosts.</summary>
    public List<CountItemDTO> TopReferrers { get; set; } = new();

    /// <summary>Views by device class.</summary>
    public List<CountItemDTO> Devices { get; set; } = new();

    /// <summary>Views by country.</summary>
    public List<CountItemDTO> Countries { get; set; } = new();
}
