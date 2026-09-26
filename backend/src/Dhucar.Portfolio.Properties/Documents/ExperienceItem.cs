namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The current role on the profile.
 */
public class ExperienceItem
{
    /// <summary>Role title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Company.</summary>
    public string Company { get; set; } = string.Empty;

    /// <summary>Duration text.</summary>
    public string Duration { get; set; } = string.Empty;

    /// <summary>Location.</summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>Employment type.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Highlight tiles.</summary>
    public List<LabelValueItem> Highlights { get; set; } = new();

    /// <summary>Grouped contributions.</summary>
    public List<ExperienceGroupItem> Groups { get; set; } = new();
}
