namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Every registered theme, with the enabled ones and the default marked.
 */
public class ThemeSettingsDTO
{
    /// <summary>The theme the site opens in.</summary>
    public string DefaultTheme { get; set; } = string.Empty;

    /// <summary>Every registered theme, in picker order.</summary>
    public List<ThemeItemDTO> Themes { get; set; } = new();
}
