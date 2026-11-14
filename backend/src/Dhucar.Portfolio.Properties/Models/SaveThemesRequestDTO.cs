namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Sets which themes visitors can pick and which one the site opens in.
 */
public class SaveThemesRequestDTO
{
    /// <summary>The theme the site opens in; must be one of <see cref="EnabledThemes"/>.</summary>
    public string DefaultTheme { get; set; } = string.Empty;

    /// <summary>Ids of the themes visitors can pick; at least one.</summary>
    public List<string> EnabledThemes { get; set; } = new();
}
