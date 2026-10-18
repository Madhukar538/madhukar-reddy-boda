namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Result of applying a content sync.
 */
public class ContentSyncResultDTO
{
    /// <summary>Items added or updated.</summary>
    public int Applied { get; set; }

    /// <summary>True if the site confirmed it refreshed the affected pages.</summary>
    public bool IsRevalidated { get; set; }
}
