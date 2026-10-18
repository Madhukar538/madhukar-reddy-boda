namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A post as listed in the admin, without its body.
 */
public class PostListItemDTO
{
    /// <summary>Slug.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Category.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Tags.</summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>Display date.</summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>Whether it is live.</summary>
    public bool IsPublished { get; set; }

    /// <summary>UTC last update.</summary>
    public DateTime UpdatedAt { get; set; }
}
