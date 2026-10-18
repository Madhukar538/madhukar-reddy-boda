namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One page of projects for the admin list.
 */
public class GetAllProjectsRequestDTO : PageRequestDTO
{
    /// <summary>key, client or lab; empty for all.</summary>
    public string Kind { get; set; } = string.Empty;
}
