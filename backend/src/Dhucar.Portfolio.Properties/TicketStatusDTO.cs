namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  What a reporter sees about their own ticket: no contact details, no private notes, no admin names.
 */
public class TicketStatusDTO
{
    /// <summary>Ticket id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>One-line summary they gave.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Bug, Performance and so on.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>P1 to P4.</summary>
    public string Priority { get; set; } = string.Empty;

    /// <summary>open, in-progress, resolved or closed.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>UTC time it was filed.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time of the last change.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>UTC time it was first resolved or closed.</summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>Status changes and the notes shared with the reporter, oldest first.</summary>
    public List<TicketStatusEventDTO> Timeline { get; set; } = new();
}
