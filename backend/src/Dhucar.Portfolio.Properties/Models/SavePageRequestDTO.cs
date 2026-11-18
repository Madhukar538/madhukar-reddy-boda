namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A page to create or update; a changed slug moves the page to the new address.
 */
public class SavePageRequestDTO
{
    /// <summary>The page's current address when editing; empty for a new page.</summary>
    public string OriginalSlug { get; set; } = string.Empty;

    /// <summary>The address to save it at: lower-case letters, digits and hyphens.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>The page's heading and title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>A sentence under the heading.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>The body as HTML; sanitized before it is stored.</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Shown on the site.</summary>
    public bool IsPublished { get; set; }

    /// <summary>Where the site links to it besides the sitemap: "" (nowhere), "footer" or "menu" (the Work menu).</summary>
    public string ShowIn { get; set; } = string.Empty;
}
