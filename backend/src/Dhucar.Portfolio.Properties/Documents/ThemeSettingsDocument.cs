namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Which site themes visitors can pick, and which one the site opens in.
 */
public class ThemeSettingsDocument
{
    /// <summary>The single settings document's id.</summary>
    public const string DocumentId = "themes";

    /// <summary>Always <see cref="DocumentId"/>.</summary>
    public string Id { get; set; } = DocumentId;

    /// <summary>The theme the site opens in; always one of the enabled themes.</summary>
    public string DefaultTheme { get; set; } = string.Empty;

    /// <summary>Ids of the themes visitors can pick.</summary>
    public List<string> EnabledThemes { get; set; } = new();

    /// <summary>When an admin last saved the settings.</summary>
    public DateTime UpdatedAt { get; set; }
}
