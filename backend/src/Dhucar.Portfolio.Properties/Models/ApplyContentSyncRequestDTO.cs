namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Applies the chosen differences from the built-in content.
 */
public class ApplyContentSyncRequestDTO
{
    /// <summary>Items to add or update.</summary>
    public List<ContentSyncSelectionDTO> Items { get; set; } = new();
}
