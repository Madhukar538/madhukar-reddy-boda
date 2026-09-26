using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  A short-lived, single-use challenge (passkey ceremony, MFA or TOTP enrolment).
 */
[BsonIgnoreExtraElements]
public class AuthChallengeDocument
{
    /// <summary>Random challenge id handed to the client.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>passkey-register, passkey-login, mfa or enroll.</summary>
    public string Kind { get; set; } = string.Empty;

    /// <summary>User the challenge belongs to (empty for passkey-login).</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Ceremony options JSON or other state.</summary>
    public string Payload { get; set; } = string.Empty;

    /// <summary>UTC expiry; a TTL index deletes expired challenges.</summary>
    public DateTime ExpiresAt { get; set; }
}
