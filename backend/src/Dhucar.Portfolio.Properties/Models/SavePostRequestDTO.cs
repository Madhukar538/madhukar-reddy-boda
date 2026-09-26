namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Creates or updates a post.
 */
public class SavePostRequestDTO
{
    /// <summary>URL slug (lowercase letters, digits, hyphens).</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Excerpt.</summary>
    public string Excerpt { get; set; } = string.Empty;

    /// <summary>HTML body (sanitised on save).</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Display date, e.g. "September 26, 2026".</summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>Category.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Tags.</summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>Publish immediately.</summary>
    public bool IsPublished { get; set; }
}
