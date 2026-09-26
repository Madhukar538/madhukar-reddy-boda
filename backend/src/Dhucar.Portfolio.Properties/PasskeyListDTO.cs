namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A registered passkey (no key material).
 */
public class PasskeyListDTO
{
    /// <summary>Credential id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Label.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>UTC registration time.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC last use.</summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>Synced passkey.</summary>
    public bool IsBackedUp { get; set; }
}
