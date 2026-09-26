namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A sensitive action confirmed with a fresh authenticator code.
 */
public class StepUpRequestDTO
{
    /// <summary>Current 6-digit authenticator code.</summary>
    public string Code { get; set; } = string.Empty;
}
