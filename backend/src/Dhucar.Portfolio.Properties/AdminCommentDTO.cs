namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A comment as listed for moderation.
 */
public class AdminCommentDTO
{
    /// <summary>Comment id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Post slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Post title.</summary>
    public string PostTitle { get; set; } = string.Empty;

    /// <summary>Commenter name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Comment text.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>pending, approved or spam.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Two-letter country, or empty.</summary>
    public string Country { get; set; } = string.Empty;

    /// <summary>UTC time it was posted.</summary>
    public DateTime CreatedAt { get; set; }
}
