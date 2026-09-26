namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A labelled group of contributions.
 */
public class ExperienceGroupItem
{
    /// <summary>Group label.</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Contributions.</summary>
    public List<string> Items { get; set; } = new();
}
