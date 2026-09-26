namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Authentication, encryption and transport security settings.
 */
public class SecuritySettings
{
    /// <summary>Base64 HMAC-SHA256 signing key for JWTs, at least 32 random bytes.</summary>
    public string JwtSigningKey { get; set; } = string.Empty;

    /// <summary>JWT issuer.</summary>
    public string JwtIssuer { get; set; } = "dhucar-portfolio-api";

    /// <summary>JWT audience.</summary>
    public string JwtAudience { get; set; } = "dhucar-portfolio-admin";

    /// <summary>Access token lifetime in minutes.</summary>
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>Refresh token lifetime in days (each use rotates it).</summary>
    public int RefreshTokenDays { get; set; } = 7;

    /// <summary>Base64 AES-256 key (32 bytes) encrypting TOTP secrets at rest.</summary>
    public string EncryptionKey { get; set; } = string.Empty;

    /// <summary>One-time token required to create the admin account; empty disables setup.</summary>
    public string SetupToken { get; set; } = string.Empty;

    /// <summary>Origins allowed to call the API from a browser, e.g. https://dhucar.in.</summary>
    public List<string> AllowedOrigins { get; set; } = new();

    /// <summary>Trust Cloudflare's CF-Connecting-IP and CF-IPCountry headers (only when the API is reachable solely through Cloudflare).</summary>
    public bool IsCloudflareTrusted { get; set; }

    /// <summary>Mark the refresh cookie Secure and use the __Host- prefix (disable only for local HTTP development).</summary>
    public bool IsCookieSecure { get; set; } = true;

    /// <summary>Failed attempts before a temporary lockout.</summary>
    public int MaxFailedAttempts { get; set; } = 5;

    /// <summary>Lockout duration in minutes.</summary>
    public int LockoutMinutes { get; set; } = 15;

    /// <summary>Sign-in requests allowed per client IP per minute.</summary>
    public int AuthRequestsPerMinute { get; set; } = 10;
}
