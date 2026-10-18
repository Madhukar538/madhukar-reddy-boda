namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One page of an admin list, with the totals the page controls need.
 */
public class PagedResultDTO<T>
{
    /// <summary>The items on this page.</summary>
    public List<T> Items { get; set; } = new();

    /// <summary>1-based page number.</summary>
    public int Page { get; set; }

    /// <summary>Items per page.</summary>
    public int PageSize { get; set; }

    /// <summary>Items across all pages.</summary>
    public long TotalCount { get; set; }

    /// <summary>Number of pages (at least 1).</summary>
    public int TotalPages { get; set; }
}
