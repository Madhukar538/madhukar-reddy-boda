using System.Security.Cryptography;
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
 * Description     :  Per-day random salts for visitor hashes (deleted after two days by a TTL index).
 */
public class SaltDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetOrCreateSaltDB
    // Method Description    :   Returns today's salt, creating it atomically if it doesn't exist yet.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   day
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetOrCreateSaltDB : </c> Returns today's salt, creating it atomically if it doesn't exist yet.
    /// </summary>
    public async Task<string> GetOrCreateSaltDB(string day)
    {
        DailySaltDocument salt = await context.DailySalts.FindOneAndUpdateAsync(
            x => x.Id == day,
            Builders<DailySaltDocument>.Update
                .SetOnInsert(x => x.Salt, Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)))
                .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<DailySaltDocument> { IsUpsert = true, ReturnDocument = ReturnDocument.After });
        return salt.Salt;
    }
}
