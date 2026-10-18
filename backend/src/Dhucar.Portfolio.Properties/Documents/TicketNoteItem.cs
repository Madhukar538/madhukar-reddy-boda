namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One note or change on a ticket.
 */
public class TicketNoteItem
{
    /// <summary>UTC time.</summary>
    public DateTime At { get; set; }

    /// <summary>The note, or a description of the change.</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Admin email.</summary>
    public string By { get; set; } = string.Empty;
}
