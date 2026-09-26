using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Sign-in switches the owner changes by hand in the database (collection "settings", _id "security").
 */
[BsonIgnoreExtraElements]
public class SecuritySettingsDocument
{
    /// <summary>The fixed id of the one settings document.</summary>
    public const string DocumentId = "security";

    /// <summary>Always "security".</summary>
    [BsonId]
    public string Id { get; set; } = DocumentId;

    /// <summary>False turns off email + password + code sign-in, leaving passkeys only. Ignored while no passkey is registered, so the admin can't be locked out.</summary>
    public bool IsPasswordLoginEnabled { get; set; } = true;

    /// <summary>UTC time the document was created.</summary>
    public DateTime CreatedAt { get; set; }
}
