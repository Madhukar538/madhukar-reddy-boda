using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A support ticket from the site (bug report or enquiry), with its triage, status and notes.
 */
[BsonIgnoreExtraElements]
public class TicketDocument
{
    /// <summary>Ticket id issued by the site (e.g. BUG-20261018-AB12).</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Who filed it.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Email or phone to reply to.</summary>
    public string Contact { get; set; } = string.Empty;

    /// <summary>Bug, Performance, Architecture and so on.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>One-line summary.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>What is wrong, in their words.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Urgency they chose.</summary>
    public string Urgency { get; set; } = string.Empty;

    /// <summary>Their stack, if given.</summary>
    public string Stack { get; set; } = string.Empty;

    /// <summary>A link they gave (repo, page, error log).</summary>
    public string Link { get; set; } = string.Empty;

    /// <summary>Site page it was filed from, if any.</summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>P1 to P4.</summary>
    public string Priority { get; set; } = string.Empty;

    /// <summary>Why triage chose the priority.</summary>
    public List<string> TriageReasons { get; set; } = new();

    /// <summary>open, in-progress, resolved or closed.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Working notes and status changes, oldest first.</summary>
    public List<TicketNoteItem> Notes { get; set; } = new();

    /// <summary>UTC time it was filed.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time of the last change.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>UTC time it was first resolved or closed.</summary>
    public DateTime? ResolvedAt { get; set; }
}
