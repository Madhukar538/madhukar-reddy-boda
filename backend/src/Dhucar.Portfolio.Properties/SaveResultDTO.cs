namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Result of a content save.
 */
public class SaveResultDTO
{
    /// <summary>Saved item id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>True if the site confirmed it refreshed the affected pages.</summary>
    public bool IsRevalidated { get; set; }
}
