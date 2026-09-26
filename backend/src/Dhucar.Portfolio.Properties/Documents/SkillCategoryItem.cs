namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A group of skills on the profile.
 */
public class SkillCategoryItem
{
    /// <summary>Group title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>green, cyan or amber.</summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>Skills in the group.</summary>
    public List<string> Skills { get; set; } = new();
}
