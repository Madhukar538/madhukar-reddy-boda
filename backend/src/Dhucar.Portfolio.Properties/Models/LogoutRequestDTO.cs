namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Signs out.
 */
public class LogoutRequestDTO
{
    /// <summary>True to sign out every session and invalidate all access tokens.</summary>
    public bool IsAllSessions { get; set; }
}
