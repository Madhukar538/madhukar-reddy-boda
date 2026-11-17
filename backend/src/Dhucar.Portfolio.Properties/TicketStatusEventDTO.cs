namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One entry on a reporter's ticket timeline.
 */
public class TicketStatusEventDTO
{
    /// <summary>UTC time.</summary>
    public DateTime At { get; set; }

    /// <summary>What happened, as shown to the reporter.</summary>
    public string Text { get; set; } = string.Empty;
}
