namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One blog post in the seed file.
 */
public class SeedPostDTO
{
    /// <summary>URL slug, also the post id.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Post title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Short summary.</summary>
    public string Excerpt { get; set; } = string.Empty;

    /// <summary>HTML body.</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Display date, e.g. "October 18, 2026".</summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>Category.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Tags.</summary>
    public List<string> Tags { get; set; } = new();
}
