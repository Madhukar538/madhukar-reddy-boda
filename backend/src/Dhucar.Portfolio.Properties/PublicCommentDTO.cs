namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  An approved comment as shown on the site.
 */
public class PublicCommentDTO
{
    /// <summary>Comment id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Commenter name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Comment text.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>UTC time it was posted.</summary>
    public DateTime CreatedAt { get; set; }
}
