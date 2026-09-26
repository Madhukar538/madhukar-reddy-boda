namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Creates or updates a project.
 */
public class SaveProjectRequestDTO
{
    /// <summary>Existing id to update; empty to create from the title.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>key, client or lab.</summary>
    public string Kind { get; set; } = string.Empty;

    /// <summary>Title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Description.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Technologies.</summary>
    public List<string> Tech { get; set; } = new();

    /// <summary>Write-up post slug.</summary>
    public string Post { get; set; } = string.Empty;

    /// <summary>Featured (key).</summary>
    public bool IsFeatured { get; set; }

    /// <summary>Outcome (key).</summary>
    public string Outcome { get; set; } = string.Empty;

    /// <summary>Status (lab).</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Client (client).</summary>
    public string Client { get; set; } = string.Empty;

    /// <summary>Role (client).</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>Duration (client).</summary>
    public string Duration { get; set; } = string.Empty;

    /// <summary>URL (client).</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>Responsibilities (client).</summary>
    public List<string> Responsibilities { get; set; } = new();

    /// <summary>Display order.</summary>
    public int SortOrder { get; set; }

    /// <summary>Published.</summary>
    public bool IsPublished { get; set; }
}
