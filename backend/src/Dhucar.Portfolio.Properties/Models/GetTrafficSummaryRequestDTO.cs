namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Traffic summary window.
 */
public class GetTrafficSummaryRequestDTO
{
    /// <summary>Days to include, 1 to 365 (default 30).</summary>
    public int Days { get; set; }
}
