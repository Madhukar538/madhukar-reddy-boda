namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Approves or deletes a comment.
 */
public class ModerateCommentRequestDTO
{
    /// <summary>Comment id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>approve or delete.</summary>
    public string Action { get; set; } = string.Empty;
}
