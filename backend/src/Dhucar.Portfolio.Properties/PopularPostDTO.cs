namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A post in the most-read list.
 */
public class PopularPostDTO
{
    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Post title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Page views of the post.</summary>
    public long Reads { get; set; }

    /// <summary>Total reactions.</summary>
    public long Reactions { get; set; }
}
