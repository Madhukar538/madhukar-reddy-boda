namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Paging and search for admin lists; list requests derive from it.
 */
public class PageRequestDTO
{
    /// <summary>1-based page number.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Items per page (1 to 100).</summary>
    public int PageSize { get; set; } = 20;

    /// <summary>Optional text to match.</summary>
    public string Search { get; set; } = string.Empty;
}
