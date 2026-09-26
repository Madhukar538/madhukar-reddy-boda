namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Application settings bound from the "Portfolio" configuration section (environment variables in production).
 */
public class PortfolioSettings
{
    /// <summary>MongoDB connection.</summary>
    public MongoSettings Mongo { get; set; } = new();

    /// <summary>Authentication, encryption and transport security.</summary>
    public SecuritySettings Security { get; set; } = new();

    /// <summary>WebAuthn relying-party settings.</summary>
    public PasskeySettings Passkeys { get; set; } = new();

    /// <summary>The Next.js site that is told to refresh after content changes.</summary>
    public SiteSettings Site { get; set; } = new();

    /// <summary>Traffic tracking.</summary>
    public TrackingSettings Tracking { get; set; } = new();

    /// <summary>Path to the seed content JSON imported into an empty database.</summary>
    public string SeedPath { get; set; } = string.Empty;
}
