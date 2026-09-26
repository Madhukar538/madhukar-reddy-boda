using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Security and content audit entry.
 */
[BsonIgnoreExtraElements]
public class AuditLogDocument
{
    /// <summary>Entry id (ObjectId string).</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>UTC time of the event.</summary>
    public DateTime At { get; set; }

    /// <summary>Event name, e.g. login.password, mfa.failed, post.saved.</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Whether the action succeeded.</summary>
    public bool IsSuccess { get; set; }

    /// <summary>Acting admin user id, if known.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Email involved, if any.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Client IP of the admin request.</summary>
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>Client user agent (truncated).</summary>
    public string UserAgent { get; set; } = string.Empty;

    /// <summary>Extra context, never secrets.</summary>
    public string Detail { get; set; } = string.Empty;
}
