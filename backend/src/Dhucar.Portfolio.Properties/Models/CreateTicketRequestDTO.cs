namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A triaged ticket sent by the site (signed server-to-server).
 */
public class CreateTicketRequestDTO
{
    /// <summary>Ticket id issued by the site.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Who filed it.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Email or phone.</summary>
    public string Contact { get; set; } = string.Empty;

    /// <summary>Category.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Summary.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Details.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Urgency.</summary>
    public string Urgency { get; set; } = string.Empty;

    /// <summary>Stack.</summary>
    public string Stack { get; set; } = string.Empty;

    /// <summary>Link.</summary>
    public string Link { get; set; } = string.Empty;

    /// <summary>Page filed from.</summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>P1 to P4.</summary>
    public string Priority { get; set; } = string.Empty;

    /// <summary>Triage reasons.</summary>
    public List<string> TriageReasons { get; set; } = new();
}
