namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A new reader comment.
 */
public class AddCommentRequestDTO
{
    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Commenter name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Comment text.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>Hidden field: people leave it empty, form-filling bots do not.</summary>
    public string Website { get; set; } = string.Empty;

    /// <summary>Milliseconds between showing the form and sending it.</summary>
    public long ElapsedMs { get; set; }
}
