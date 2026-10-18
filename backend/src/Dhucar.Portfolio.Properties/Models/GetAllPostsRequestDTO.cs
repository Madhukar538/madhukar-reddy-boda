namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One page of posts for the admin list.
 */
public class GetAllPostsRequestDTO : PageRequestDTO
{
    /// <summary>all, published or draft.</summary>
    public string Status { get; set; } = "all";
}
