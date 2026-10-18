namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Reads, reactions and approved comments for one post.
 */
public class GetPostEngagementRequestDTO
{
    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;
}
