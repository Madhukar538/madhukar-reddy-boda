namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One registered site theme and whether visitors can pick it.
 */
public class ThemeItemDTO
{
    /// <summary>Theme id, the value of data-style on the site (e.g. "terminal").</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Name shown in the picker.</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>One-line description shown under the name.</summary>
    public string Hint { get; set; } = string.Empty;

    /// <summary>True when visitors can pick it.</summary>
    public bool IsEnabled { get; set; }

    /// <summary>True for the theme the site opens in.</summary>
    public bool IsDefault { get; set; }
}
