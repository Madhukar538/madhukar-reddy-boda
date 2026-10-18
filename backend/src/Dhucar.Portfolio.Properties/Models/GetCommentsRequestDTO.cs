namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Comments to list for moderation.
 */
public class GetCommentsRequestDTO : PageRequestDTO
{
    /// <summary>pending, approved, spam or all.</summary>
    public string Status { get; set; } = "pending";
}
