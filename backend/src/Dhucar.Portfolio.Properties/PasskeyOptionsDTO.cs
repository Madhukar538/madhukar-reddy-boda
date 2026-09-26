using System.Text.Json;

namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  WebAuthn options to pass to navigator.credentials.create() or get().
 */
public class PasskeyOptionsDTO
{
    /// <summary>Echo this back when completing the ceremony.</summary>
    public string ChallengeId { get; set; } = string.Empty;

    /// <summary>Options JSON.</summary>
    public JsonElement Options { get; set; } = new();
}
