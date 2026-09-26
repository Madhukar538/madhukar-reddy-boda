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
 * Description     :  Passkey credential storage.
 */
public class PasskeyDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPasskeysByUserDB
    // Method Description    :   Lists a user's passkeys.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of PasskeyDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPasskeysByUserDB : </c> Lists a user's passkeys.
    /// </summary>
    public async Task<List<PasskeyDocument>> GetPasskeysByUserDB(string userId)
    {
        return await context.Passkeys.Find(x => x.UserId == userId).SortBy(x => x.CreatedAt).ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPasskeyByIdDB
    // Method Description    :   Finds a passkey by credential id.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   credentialId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PasskeyDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPasskeyByIdDB : </c> Finds a passkey by credential id.
    /// </summary>
    public async Task<PasskeyDocument?> GetPasskeyByIdDB(string credentialId)
    {
        return await context.Passkeys.Find(x => x.Id == credentialId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertPasskeyDB
    // Method Description    :   Stores a new passkey.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   passkey
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertPasskeyDB : </c> Stores a new passkey.
    /// </summary>
    public async Task InsertPasskeyDB(PasskeyDocument passkey)
    {
        await context.Passkeys.InsertOneAsync(passkey);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpdatePasskeyUsageDB
    // Method Description    :   Records a sign-in: new counter, backup state and time.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   credentialId, signCount, isBackedUp
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpdatePasskeyUsageDB : </c> Records a sign-in: new counter, backup state and time.
    /// </summary>
    public async Task UpdatePasskeyUsageDB(string credentialId, long signCount, bool isBackedUp)
    {
        await context.Passkeys.UpdateOneAsync(x => x.Id == credentialId, Builders<PasskeyDocument>.Update
            .Set(x => x.SignCount, signCount)
            .Set(x => x.IsBackedUp, isBackedUp)
            .Set(x => x.LastUsedAt, DateTime.UtcNow));
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeletePasskeyDB
    // Method Description    :   Deletes a passkey owned by the user.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   credentialId, userId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeletePasskeyDB : </c> Deletes a passkey owned by the user.
    /// </summary>
    public async Task<bool> DeletePasskeyDB(string credentialId, string userId)
    {
        DeleteResult result = await context.Passkeys.DeleteOneAsync(x => x.Id == credentialId && x.UserId == userId);
        return result.DeletedCount == 1;
    }
}
