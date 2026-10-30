using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  The record of data migrations that have run.
 */
public class MigrationDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetAppliedIdsDB
    // Method Description    :   Ids of the migrations already applied.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   HashSet of migration ids
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetAppliedIdsDB : </c> Ids of the migrations already applied.
    /// </summary>
    public async Task<HashSet<string>> GetAppliedIdsDB()
    {
        List<string> ids = await context.Migrations.Find(FilterDefinition<MigrationDocument>.Empty).Project(x => x.Id).ToListAsync();
        return ids.ToHashSet(StringComparer.Ordinal);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   MarkAppliedDB
    // Method Description    :   Records a migration as applied (once; a second record for the same id is ignored).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   id, description, appliedAt
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>MarkAppliedDB : </c> Records a migration as applied (once; a second record for the same id is ignored).
    /// </summary>
    public async Task MarkAppliedDB(string id, string description, DateTime appliedAt)
    {
        UpdateDefinition<MigrationDocument> update = Builders<MigrationDocument>.Update
            .SetOnInsert(x => x.Description, description)
            .SetOnInsert(x => x.AppliedAt, appliedAt);
        await context.Migrations.UpdateOneAsync(x => x.Id == id, update, new UpdateOptions { IsUpsert = true });
    }
}
