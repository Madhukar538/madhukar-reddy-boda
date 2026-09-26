namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Returned by Login when the password is correct.
 */
public class MfaChallengeDTO
{
    /// <summary>Token for VerifyMfa, valid 5 minutes.</summary>
    public string MfaToken { get; set; } = string.Empty;

    /// <summary>UTC expiry.</summary>
    public DateTime ExpiresAt { get; set; }
}
