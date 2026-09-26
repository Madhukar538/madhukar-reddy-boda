namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Audit log page.
 */
public class GetAuditLogRequestDTO
{
    /// <summary>Entries to return, 1 to 200 (default 50).</summary>
    public int Limit { get; set; }
}
