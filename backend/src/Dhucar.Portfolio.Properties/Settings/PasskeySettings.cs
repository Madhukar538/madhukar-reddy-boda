namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  WebAuthn relying-party settings.
 */
public class PasskeySettings
{
    /// <summary>Relying party id: the site's registrable domain, e.g. dhucar.in.</summary>
    public string RpId { get; set; } = string.Empty;

    /// <summary>Name shown by the authenticator.</summary>
    public string RpName { get; set; } = "dhucar.in admin";

    /// <summary>Exact origins allowed to complete ceremonies, e.g. https://dhucar.in.</summary>
    public List<string> Origins { get; set; } = new();
}
