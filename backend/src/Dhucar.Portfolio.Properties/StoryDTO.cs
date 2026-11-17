namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The site's story: its JSON, empty until one is saved (the site then shows its built-in story).
 */
public class StoryDTO
{
    /// <summary>The story as JSON, or empty.</summary>
    public string Json { get; set; } = string.Empty;

    /// <summary>UTC time of the last save, if any.</summary>
    public DateTime? UpdatedAt { get; set; }
}
