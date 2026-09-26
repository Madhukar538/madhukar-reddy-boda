namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Lists projects, optionally of one kind.
 */
public class GetProjectsRequestDTO
{
    /// <summary>key, client, lab or empty for all.</summary>
    public string Kind { get; set; } = string.Empty;
}
