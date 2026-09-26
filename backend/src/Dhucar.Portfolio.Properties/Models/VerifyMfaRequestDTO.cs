namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Second sign-in step: TOTP code or a recovery code.
 */
public class VerifyMfaRequestDTO
{
    /// <summary>Token returned by Login.</summary>
    public string MfaToken { get; set; } = string.Empty;

    /// <summary>6-digit authenticator code.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Single-use recovery code (instead of Code).</summary>
    public string RecoveryCode { get; set; } = string.Empty;
}
