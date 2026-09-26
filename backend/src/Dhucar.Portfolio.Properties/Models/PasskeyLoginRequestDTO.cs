using System.Text.Json;

namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Completes passkey sign-in.
 */
public class PasskeyLoginRequestDTO
{
    /// <summary>Id returned by PasskeyLoginOptions.</summary>
    public string ChallengeId { get; set; } = string.Empty;

    /// <summary>PublicKeyCredential from navigator.credentials.get(), as JSON.</summary>
    public JsonElement Credential { get; set; } = new();
}
