using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The single profile document: identity, skills, experience, education.
 */
[BsonIgnoreExtraElements]
public class ProfileDocument
{
    /// <summary>Always "profile".</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Full name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Job title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Current company.</summary>
    public string Company { get; set; } = string.Empty;

    /// <summary>Location.</summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>Public contact email.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Public phone number.</summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>tel: link.</summary>
    public string PhoneHref { get; set; } = string.Empty;

    /// <summary>GitHub profile URL.</summary>
    public string Github { get; set; } = string.Empty;

    /// <summary>LinkedIn profile URL (empty hides it).</summary>
    public string Linkedin { get; set; } = string.Empty;

    /// <summary>Twitter/X profile URL (empty hides it).</summary>
    public string Twitter { get; set; } = string.Empty;

    /// <summary>Professional summary.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>Skill groups.</summary>
    public List<SkillCategoryItem> SkillCategories { get; set; } = new();

    /// <summary>Current role.</summary>
    public ExperienceItem Experience { get; set; } = new();

    /// <summary>Education.</summary>
    public EducationItem Education { get; set; } = new();

    /// <summary>UTC last update.</summary>
    public DateTime UpdatedAt { get; set; }
}
