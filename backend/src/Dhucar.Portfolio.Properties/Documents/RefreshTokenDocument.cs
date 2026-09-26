using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A refresh token (stored only as a hash), part of a rotation family.
 */
[BsonIgnoreExtraElements]
public class RefreshTokenDocument
{
    /// <summary>SHA-256 hash of the token.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>Session id shared by every rotation of one sign-in.</summary>
    public string FamilyId { get; set; } = string.Empty;

    /// <summary>Owning admin user id.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>UTC creation time.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC expiry; a TTL index deletes expired tokens.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>UTC time the token was used or revoked.</summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>Comma-separated methods used at sign-in (pwd,otp / hwk).</summary>
    public string AuthMethods { get; set; } = string.Empty;
}
