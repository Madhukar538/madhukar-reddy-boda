namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Returned by SetupAdmin: scan the secret into an authenticator app, then confirm.
 */
public class SetupAdminResponseDTO
{
    /// <summary>Short-lived token for ConfirmTotpSetup.</summary>
    public string EnrollmentToken { get; set; } = string.Empty;

    /// <summary>Base32 secret for manual entry.</summary>
    public string TotpSecret { get; set; } = string.Empty;

    /// <summary>otpauth:// URI for a QR code.</summary>
    public string OtpAuthUri { get; set; } = string.Empty;
}
