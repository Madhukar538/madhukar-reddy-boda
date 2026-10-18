namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Identifies one item to load for editing.
 */
public class GetItemRequestDTO
{
    /// <summary>Item id or slug.</summary>
    public string Id { get; set; } = string.Empty;
}
