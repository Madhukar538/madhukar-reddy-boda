using Dhucar.Portfolio.Properties.Documents;

namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The site's built-in content as exported to seed/content.json.
 */
public class SeedContentDTO
{
    /// <summary>Blog posts.</summary>
    public List<SeedPostDTO> Posts { get; set; } = new();

    /// <summary>Key, client and Lab projects.</summary>
    public List<ProjectDocument> Projects { get; set; } = new();

    /// <summary>Profile, skills, experience and education.</summary>
    public ProfileDocument? Profile { get; set; }
}
