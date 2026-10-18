namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A ticket as listed in the admin.
 */
public class TicketListItemDTO
{
    /// <summary>Ticket id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Summary.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Category.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>P1 to P4.</summary>
    public string Priority { get; set; } = string.Empty;

    /// <summary>Status.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Who filed it.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Notes so far.</summary>
    public int NoteCount { get; set; }

    /// <summary>UTC time it was filed.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time of the last change.</summary>
    public DateTime UpdatedAt { get; set; }
}
