namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  An access token (the refresh token travels in an HttpOnly cookie).
 */
public class AuthTokenDTO
{
    /// <summary>Bearer token.</summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>UTC expiry.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Signed-in admin.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Methods used: pwd, otp, rec (recovery code) or hwk (passkey).</summary>
    public List<string> AuthMethods { get; set; } = new();

    /// <summary>Unused recovery codes remaining.</summary>
    public int RecoveryCodesLeft { get; set; }
}
