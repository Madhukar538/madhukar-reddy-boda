namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Ticket counts for the admin dashboard.
 */
public class TicketSummaryDTO
{
    /// <summary>All tickets.</summary>
    public long Total { get; set; }

    /// <summary>Count per status.</summary>
    public Dictionary<string, long> ByStatus { get; set; } = new();

    /// <summary>Open and in-progress tickets per priority.</summary>
    public Dictionary<string, long> ActiveByPriority { get; set; } = new();

    /// <summary>Filed in the last 7 days.</summary>
    public long NewLast7Days { get; set; }

    /// <summary>Filed in the last 30 days.</summary>
    public long NewLast30Days { get; set; }

    /// <summary>Average hours from filing to resolution, over the last 90 days.</summary>
    public double? AverageResolutionHours { get; set; }

    /// <summary>Newest active tickets, highest priority first.</summary>
    public List<TicketListItemDTO> Recent { get; set; } = new();
}
