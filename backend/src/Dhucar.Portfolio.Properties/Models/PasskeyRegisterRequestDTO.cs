using System.Text.Json;

namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Completes passkey registration.
 */
public class PasskeyRegisterRequestDTO
{
    /// <summary>Id returned by PasskeyRegisterOptions.</summary>
    public string ChallengeId { get; set; } = string.Empty;

    /// <summary>Label for the passkey.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>PublicKeyCredential from navigator.credentials.create(), as JSON.</summary>
    public JsonElement Credential { get; set; } = new();
}
