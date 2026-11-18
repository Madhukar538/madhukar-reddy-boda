namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The whole bug log to save, newest first (an empty list clears it).
 */
public class SaveBugLogRequestDTO
{
    /// <summary>The entries, newest first.</summary>
    public List<BugEntryDTO> Entries { get; set; } = new();
}
