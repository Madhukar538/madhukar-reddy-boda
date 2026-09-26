namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  26 Sep 2026
 * Modified Reason :  Passkey-only switch.
 * Layer           :  Properties
 * Modified By     :  Boda Madhukar Reddy
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

    /// <summary>The switch as set in the database (settings/security.IsPasswordLoginEnabled).</summary>
    public bool IsPasswordLoginEnabled { get; set; }

    /// <summary>Whether password sign-in actually works now: the switch, or on anyway while no passkey exists.</summary>
    public bool IsPasswordLoginAllowed { get; set; }
}
