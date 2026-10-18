namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Changes a ticket’s status or priority and/or adds a note.
 */
public class UpdateTicketRequestDTO
{
    /// <summary>Ticket id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>New status, or empty to keep it.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>New priority, or empty to keep it.</summary>
    public string Priority { get; set; } = string.Empty;

    /// <summary>A note to add, or empty.</summary>
    public string Note { get; set; } = string.Empty;
}
