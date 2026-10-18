namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One difference between the deployed built-in content and the database.
 */
public class ContentSyncItemDTO
{
    /// <summary>post, project or profile.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Post slug, project id, or "profile" for the profile's skill groups and links.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Title shown to the admin.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>new (only in the built-in content) or changed (differs from the database).</summary>
    public string Change { get; set; } = string.Empty;

    /// <summary>For a changed item, the fields that differ.</summary>
    public List<string> Fields { get; set; } = new();
}
