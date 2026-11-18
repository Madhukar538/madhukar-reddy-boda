namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A page made in the admin. In lists the content is left empty.
 */
public class PageDTO
{
    /// <summary>The page's address, e.g. "uses" for /uses.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>The page's heading and title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>A sentence under the heading.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>The body as sanitized HTML; empty in lists.</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Shown on the site.</summary>
    public bool IsPublished { get; set; }

    /// <summary>UTC time it was last saved.</summary>
    public DateTime UpdatedAt { get; set; }
}
