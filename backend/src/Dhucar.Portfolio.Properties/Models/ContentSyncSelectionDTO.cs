namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One item the admin chose to add or update from the built-in content.
 */
public class ContentSyncSelectionDTO
{
    /// <summary>post, project or profile.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Post slug, project id, or "skills".</summary>
    public string Id { get; set; } = string.Empty;
}
