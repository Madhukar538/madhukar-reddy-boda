namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One page of tickets for the admin list.
 */
public class GetTicketsRequestDTO : PageRequestDTO
{
    /// <summary>active (open and in progress), open, in-progress, resolved, closed or all.</summary>
    public string Status { get; set; } = "active";

    /// <summary>P1 to P4, or empty for all.</summary>
    public string Priority { get; set; } = string.Empty;
}
