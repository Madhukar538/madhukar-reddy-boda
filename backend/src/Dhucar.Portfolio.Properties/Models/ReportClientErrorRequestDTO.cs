namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A script error a visitor's browser reports: the message, where it was thrown and the page.
 */
public class ReportClientErrorRequestDTO
{
    /// <summary>The error message.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>The script URL it came from, if known.</summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>Line in the script, if known.</summary>
    public int Line { get; set; }

    /// <summary>Column in the script, if known.</summary>
    public int Column { get; set; }

    /// <summary>The stack, if there is one.</summary>
    public string Stack { get; set; } = string.Empty;

    /// <summary>The page path it happened on.</summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>The site look the page was shown in.</summary>
    public string Look { get; set; } = string.Empty;
}
