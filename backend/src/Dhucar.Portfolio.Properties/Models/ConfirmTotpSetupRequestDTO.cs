namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Confirms the authenticator app during setup.
 */
public class ConfirmTotpSetupRequestDTO
{
    /// <summary>Token returned by SetupAdmin.</summary>
    public string EnrollmentToken { get; set; } = string.Empty;

    /// <summary>Current 6-digit code from the authenticator app.</summary>
    public string Code { get; set; } = string.Empty;
}
