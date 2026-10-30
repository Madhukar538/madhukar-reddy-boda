namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :  30 Oct 2026
 * Modified Reason :  Reports which values are missing instead of failing startup
 * Layer           :  Properties
 * Modified By     :  Boda Madhukar Reddy
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

    /// <summary>How often to look up the public IP (a tiny request; Atlas is only called when it changed).</summary>
    public int CheckSeconds { get; set; } = 30;

    /// <summary>How often to check the access list in Atlas even if the IP is the same (repairs a removed entry).</summary>
    public int ReconcileMinutes { get; set; } = 15;

    /// <summary>Marks the entries this service manages; it only ever removes entries with this comment.</summary>
    public string Comment { get; set; } = "portfolio-api (auto)";

    /// <summary>Returns the caller's public IPv4 address as plain text.</summary>
    public string IpEchoUrl { get; set; } = "https://api.ipify.org";

    /// <summary>Atlas Administration API base address.</summary>
    public string BaseUrl { get; set; } = "https://cloud.mongodb.com";

    /// <summary>Whether the sync is configured (all three values set).</summary>
    public bool IsEnabled => Missing().Count == 0;

    /// <summary>Whether any of the three values is set (so a partial setup can be reported).</summary>
    public bool IsAnySet => !string.IsNullOrWhiteSpace(PublicKey) || !string.IsNullOrWhiteSpace(PrivateKey) || !string.IsNullOrWhiteSpace(ProjectId);

    /// <summary>The settings still empty, by environment variable name, for the log.</summary>
    public List<string> Missing()
    {
        List<string> missing = new List<string>();
        if (string.IsNullOrWhiteSpace(PublicKey))
        {
            missing.Add("ATLAS_PUBLIC_KEY");
        }
        if (string.IsNullOrWhiteSpace(PrivateKey))
        {
            missing.Add("ATLAS_PRIVATE_KEY");
        }
        if (string.IsNullOrWhiteSpace(ProjectId))
        {
            missing.Add("ATLAS_PROJECT_ID");
        }
        return missing;
    }
}
