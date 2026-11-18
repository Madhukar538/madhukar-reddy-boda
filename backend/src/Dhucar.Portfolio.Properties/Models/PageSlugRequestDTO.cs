namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Names one page made in the admin: to read, open for editing or delete.
 */
public class PageSlugRequestDTO
{
    /// <summary>The page's address, e.g. "uses".</summary>
    public string Slug { get; set; } = string.Empty;
}
