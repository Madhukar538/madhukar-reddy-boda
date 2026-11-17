namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A story to save as JSON; empty removes the saved one (back to the built-in story).
 */
public class SaveStoryRequestDTO
{
    /// <summary>The story as JSON, or empty to remove it.</summary>
    public string Json { get; set; } = string.Empty;
}
