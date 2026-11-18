namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Which browser error to clear once it is fixed; empty clears them all.
 */
public class ClearClientErrorsRequestDTO
{
    /// <summary>The group id to clear, or empty for all.</summary>
    public string Id { get; set; } = string.Empty;
}
