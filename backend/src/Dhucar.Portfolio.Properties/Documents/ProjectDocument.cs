using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A project: key system, client e-commerce build or R&D Lab experiment.
 */
[BsonIgnoreExtraElements]
public class ProjectDocument
{
    /// <summary>Slug of the title.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>key, client or lab.</summary>
    public string Kind { get; set; } = string.Empty;

    /// <summary>Project title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Description.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Technologies.</summary>
    public List<string> Tech { get; set; } = new();

    /// <summary>Slug of a blog post that writes it up.</summary>
    public string Post { get; set; } = string.Empty;

    /// <summary>Shown large on the Projects page (key projects).</summary>
    public bool IsFeatured { get; set; }

    /// <summary>One measurable result (key projects).</summary>
    public string Outcome { get; set; } = string.Empty;

    /// <summary>SHIPPED, WIP, POC or RESEARCH (lab).</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Client name (client projects).</summary>
    public string Client { get; set; } = string.Empty;

    /// <summary>Role held (client projects).</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>Duration text (client projects).</summary>
    public string Duration { get; set; } = string.Empty;

    /// <summary>Public URL (client projects).</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>What was done (client projects).</summary>
    public List<string> Responsibilities { get; set; } = new();

    /// <summary>Display order within its kind.</summary>
    public int SortOrder { get; set; }

    /// <summary>Only published projects are served publicly.</summary>
    public bool IsPublished { get; set; }

    /// <summary>UTC last update.</summary>
    public DateTime UpdatedAt { get; set; }
}
