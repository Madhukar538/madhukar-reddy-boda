namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The bug log: its entries, newest first, and when it was last saved.
 */
public class BugLogDTO
{
    /// <summary>The entries, newest first.</summary>
    public List<BugEntryDTO> Entries { get; set; } = new();

    /// <summary>UTC time of the last save, or null when none is saved.</summary>
    public DateTime? UpdatedAt { get; set; }
}
