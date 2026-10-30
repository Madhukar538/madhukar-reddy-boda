namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Optional: keeps this server's public IP on the MongoDB Atlas project's access list
 *                    (for a host whose IP changes). Empty keys turn it off.
 */
public class AtlasSettings
{
    /// <summary>Atlas API key, public part (role: Project Network Access Manager).</summary>
    public string PublicKey { get; set; } = string.Empty;

    /// <summary>Atlas API key, private part.</summary>
    public string PrivateKey { get; set; } = string.Empty;

    /// <summary>Atlas project (group) id, from Project Settings.</summary>
    public string ProjectId { get; set; } = string.Empty;

    /// <summary>How often to check the public IP.</summary>
    public int IntervalMinutes { get; set; } = 5;

    /// <summary>Marks the entries this service manages; it only ever removes entries with this comment.</summary>
    public string Comment { get; set; } = "portfolio-api (auto)";

    /// <summary>Returns the caller's public IPv4 address as plain text.</summary>
    public string IpEchoUrl { get; set; } = "https://api.ipify.org";

    /// <summary>Atlas Administration API base address.</summary>
    public string BaseUrl { get; set; } = "https://cloud.mongodb.com";

    /// <summary>Whether the sync is configured.</summary>
    public bool IsEnabled => PublicKey.Length > 0 && PrivateKey.Length > 0 && ProjectId.Length > 0;
}
