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
 * Description     :  Refresh-token storage (hashes only) with atomic rotation.
 */
public class RefreshTokenDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertRefreshTokenDB
    // Method Description    :   Stores a new refresh token hash.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   token
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertRefreshTokenDB : </c> Stores a new refresh token hash.
    /// </summary>
    public async Task InsertRefreshTokenDB(RefreshTokenDocument token)
    {
        await context.RefreshTokens.InsertOneAsync(token);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetRefreshTokenDB
    // Method Description    :   Finds a token by hash.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   tokenHash
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   RefreshTokenDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetRefreshTokenDB : </c> Finds a token by hash.
    /// </summary>
    public async Task<RefreshTokenDocument?> GetRefreshTokenDB(string tokenHash)
    {
        return await context.RefreshTokens.Find(x => x.Id == tokenHash).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   MarkRefreshTokenUsedDB
    // Method Description    :   Atomically marks an active token used; true only for the first caller.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   tokenHash
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>MarkRefreshTokenUsedDB : </c> Atomically marks an active token used; true only for the first caller.
    /// </summary>
    public async Task<bool> MarkRefreshTokenUsedDB(string tokenHash)
    {
        DateTime now = DateTime.UtcNow;
        UpdateResult result = await context.RefreshTokens.UpdateOneAsync(
            x => x.Id == tokenHash && x.RevokedAt == null && x.ExpiresAt > now,
            Builders<RefreshTokenDocument>.Update.Set(x => x.RevokedAt, now));
        return result.ModifiedCount == 1;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   RevokeFamilyDB
    // Method Description    :   Revokes every token of one session.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   familyId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RevokeFamilyDB : </c> Revokes every token of one session.
    /// </summary>
    public async Task RevokeFamilyDB(string familyId)
    {
        await context.RefreshTokens.UpdateManyAsync(x => x.FamilyId == familyId && x.RevokedAt == null,
            Builders<RefreshTokenDocument>.Update.Set(x => x.RevokedAt, DateTime.UtcNow));
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   RevokeAllForUserDB
    // Method Description    :   Revokes every session of a user.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RevokeAllForUserDB : </c> Revokes every session of a user.
    /// </summary>
    public async Task RevokeAllForUserDB(string userId)
    {
        await context.RefreshTokens.UpdateManyAsync(x => x.UserId == userId && x.RevokedAt == null,
            Builders<RefreshTokenDocument>.Update.Set(x => x.RevokedAt, DateTime.UtcNow));
    }
}
