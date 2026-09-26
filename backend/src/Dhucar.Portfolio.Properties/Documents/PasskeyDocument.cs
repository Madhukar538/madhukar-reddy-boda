using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A registered WebAuthn passkey credential.
 */
[BsonIgnoreExtraElements]
public class PasskeyDocument
{
    /// <summary>Credential id (base64url).</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Owning admin user id.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Label chosen when registering, e.g. "MacBook Touch ID".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>COSE public key.</summary>
    public byte[] PublicKey { get; set; } = [];

    /// <summary>Last seen signature counter.</summary>
    public long SignCount { get; set; }

    /// <summary>Authenticator transports reported at registration.</summary>
    public string[] Transports { get; set; } = [];

    /// <summary>True for synced passkeys.</summary>
    public bool IsBackedUp { get; set; }

    /// <summary>UTC registration time.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC time of last use.</summary>
    public DateTime? LastUsedAt { get; set; }
}
