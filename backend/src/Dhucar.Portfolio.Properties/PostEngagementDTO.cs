namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Public engagement for one post: reads, reactions and approved comments.
 */
public class PostEngagementDTO
{
    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Page views of the post.</summary>
    public long Reads { get; set; }

    /// <summary>Count per reaction key.</summary>
    public Dictionary<string, long> Reactions { get; set; } = new();

    /// <summary>Approved comments, oldest first.</summary>
    public List<PublicCommentDTO> Comments { get; set; } = new();
}
