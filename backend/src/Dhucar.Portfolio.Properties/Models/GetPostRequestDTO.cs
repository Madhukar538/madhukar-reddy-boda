namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Gets one post by slug.
 */
public class GetPostRequestDTO
{
    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;
}
