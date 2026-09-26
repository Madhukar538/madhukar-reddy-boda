namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Removes a passkey; needs a fresh authenticator code.
 */
public class DeletePasskeyRequestDTO
{
    /// <summary>Passkey credential id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Current 6-digit authenticator code.</summary>
    public string Code { get; set; } = string.Empty;
}
