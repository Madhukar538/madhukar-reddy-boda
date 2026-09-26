using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Administrator account: credentials, TOTP state, recovery codes and lockout.
 */
[BsonIgnoreExtraElements]
public class AdminUserDocument
{
    /// <summary>Unique user id (ObjectId string).</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Lower-cased email used to sign in.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>PBKDF2 password hash (ASP.NET Core Identity format).</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>AES-GCM encrypted TOTP secret.</summary>
    public string TotpSecretProtected { get; set; } = string.Empty;

    /// <summary>True once the authenticator app has been verified.</summary>
    public bool IsTotpConfirmed { get; set; }

    /// <summary>Last accepted TOTP time step; codes at or before it are rejected (replay protection).</summary>
    public long LastTotpStep { get; set; }

    /// <summary>SHA-256 hashes of unused single-use recovery codes.</summary>
    public List<string> RecoveryCodeHashes { get; set; } = new();

    /// <summary>Consecutive failed password or MFA attempts.</summary>
    public int FailedAttempts { get; set; }

    /// <summary>UTC time until which sign-in is blocked.</summary>
    public DateTime? LockoutUntil { get; set; }

    /// <summary>Changes on logout-everywhere or credential changes; invalidates issued access tokens.</summary>
    public string SecurityStamp { get; set; } = string.Empty;

    /// <summary>Random WebAuthn user handle (never the email).</summary>
    public byte[] UserHandle { get; set; } = [];

    /// <summary>UTC creation time.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time of the last successful sign-in.</summary>
    public DateTime? LastLoginAt { get; set; }
}
