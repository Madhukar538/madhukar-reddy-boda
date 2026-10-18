namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  How many most-read posts to return.
 */
public class GetPopularPostsRequestDTO
{
    /// <summary>Number of posts (1 to 20).</summary>
    public int Limit { get; set; } = 5;
}
