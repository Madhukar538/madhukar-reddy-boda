namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The signed-in admin.
 */
public class AdminInfoDTO
{
    /// <summary>Email.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>UTC last sign-in.</summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>Registered passkeys.</summary>
    public int PasskeyCount { get; set; }

    /// <summary>Unused recovery codes.</summary>
    public int RecoveryCodesLeft { get; set; }
}
