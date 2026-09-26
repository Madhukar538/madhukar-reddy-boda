using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Reads and creates the security settings document the owner edits by hand.
 */
public class SettingsDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   EnsureSecuritySettingsDB
    // Method Description    :   Creates the settings document with its defaults if it is missing; never changes an existing one.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>EnsureSecuritySettingsDB : </c> Creates the settings document with its defaults if it is missing; never changes an existing one.
    /// </summary>
    public async Task EnsureSecuritySettingsDB()
    {
        await context.Settings.UpdateOneAsync(
            x => x.Id == SecuritySettingsDocument.DocumentId,
            Builders<SecuritySettingsDocument>.Update
                .SetOnInsert(x => x.IsPasswordLoginEnabled, true)
                .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow),
            new UpdateOptions { IsUpsert = true });
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetSecuritySettingsDB
    // Method Description    :   Reads the settings document fresh on every call, so a change in the database applies at once.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   SecuritySettingsDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetSecuritySettingsDB : </c> Reads the settings document fresh on every call, so a change in the database applies at once.
    /// </summary>
    public async Task<SecuritySettingsDocument> GetSecuritySettingsDB()
    {
        return await context.Settings.Find(x => x.Id == SecuritySettingsDocument.DocumentId).FirstOrDefaultAsync()
            ?? new SecuritySettingsDocument();
    }
}
