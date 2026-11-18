namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One fixed bug, as the bug log API reads and saves it.
 */
public class BugEntryDTO
{
    /// <summary>Short title, e.g. "Checkout API timing out at 300 rps".</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>When it was fixed, e.g. "Oct 2026".</summary>
    public string When { get; set; } = string.Empty;

    /// <summary>The stack it was in, e.g. ".NET 8 · SQL Server".</summary>
    public string Stack { get; set; } = string.Empty;

    /// <summary>What people saw.</summary>
    public string Symptom { get; set; } = string.Empty;

    /// <summary>Why it happened.</summary>
    public string Cause { get; set; } = string.Empty;

    /// <summary>What changed.</summary>
    public string Fix { get; set; } = string.Empty;

    /// <summary>The measurable result, or empty.</summary>
    public string Result { get; set; } = string.Empty;
}
