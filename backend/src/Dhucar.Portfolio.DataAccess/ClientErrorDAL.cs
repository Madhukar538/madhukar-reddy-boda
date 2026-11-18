using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Browser error groups: counted as they recur, listed for the admin and cleared once fixed.
 */
public class ClientErrorDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   RecordClientErrorDB
    // Method Description    :   Counts one more report of a known error, or starts a new group while there are fewer than maxGroups.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   error, maxGroups
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool (false when a new group was refused because the list is full)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RecordClientErrorDB : </c> Counts one more report of a known error, or starts a new group while there are fewer than maxGroups.
    /// </summary>
    public async Task<bool> RecordClientErrorDB(ClientErrorDocument error, int maxGroups)
    {
        UpdateDefinition<ClientErrorDocument> seenAgain = Builders<ClientErrorDocument>.Update
            .Inc(x => x.Count, 1)
            .Set(x => x.LastSeen, error.LastSeen)
            .Set(x => x.Page, error.Page)
            .Set(x => x.Look, error.Look)
            .Set(x => x.Browser, error.Browser);
        UpdateResult existing = await context.ClientErrors.UpdateOneAsync(x => x.Id == error.Id, seenAgain);
        if (existing.MatchedCount > 0)
        {
            return true;
        }
        if (await context.ClientErrors.CountDocumentsAsync(FilterDefinition<ClientErrorDocument>.Empty) >= maxGroups)
        {
            return false;
        }
        // Upsert, so two first reports arriving together make one group with both counted.
        UpdateDefinition<ClientErrorDocument> firstSeen = seenAgain
            .SetOnInsert(x => x.Message, error.Message)
            .SetOnInsert(x => x.Source, error.Source)
            .SetOnInsert(x => x.Line, error.Line)
            .SetOnInsert(x => x.Column, error.Column)
            .SetOnInsert(x => x.Stack, error.Stack)
            .SetOnInsert(x => x.FirstSeen, error.FirstSeen);
        await context.ClientErrors.UpdateOneAsync(x => x.Id == error.Id, firstSeen, new UpdateOptions { IsUpsert = true });
        return true;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetClientErrorsDB
    // Method Description    :   The most recently seen error groups.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of ClientErrorDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetClientErrorsDB : </c> The most recently seen error groups.
    /// </summary>
    public async Task<List<ClientErrorDocument>> GetClientErrorsDB(int limit)
    {
        return await context.ClientErrors.Find(FilterDefinition<ClientErrorDocument>.Empty)
            .SortByDescending(x => x.LastSeen)
            .Limit(limit)
            .ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeleteClientErrorsDB
    // Method Description    :   Clears one error group, or all of them when no id is given.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   id
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long (groups cleared)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteClientErrorsDB : </c> Clears one error group, or all of them when no id is given.
    /// </summary>
    public async Task<long> DeleteClientErrorsDB(string id)
    {
        FilterDefinition<ClientErrorDocument> filter = id.Length == 0
            ? FilterDefinition<ClientErrorDocument>.Empty
            : Builders<ClientErrorDocument>.Filter.Eq(x => x.Id, id);
        DeleteResult result = await context.ClientErrors.DeleteManyAsync(filter);
        return result.DeletedCount;
    }
}
