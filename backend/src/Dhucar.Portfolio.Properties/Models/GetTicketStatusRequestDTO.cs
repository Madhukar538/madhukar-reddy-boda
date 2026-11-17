namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A reporter's request for their ticket's status: the id and the secret from their status link.
 */
public class GetTicketStatusRequestDTO
{
    /// <summary>Ticket id (e.g. BUG-261117-AB12CD).</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>The secret from the status link.</summary>
    public string Token { get; set; } = string.Empty;
}
