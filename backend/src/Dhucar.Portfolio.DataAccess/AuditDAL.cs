using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Audit log writes and reads.
 */
public class AuditDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertAuditDB
    // Method Description    :   Appends an audit entry.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   entry
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertAuditDB : </c> Appends an audit entry.
    /// </summary>
    public async Task InsertAuditDB(AuditLogDocument entry)
    {
        if (string.IsNullOrEmpty(entry.Id))
        {
            entry.Id = ObjectId.GenerateNewId().ToString();
        }
        await context.AuditLog.InsertOneAsync(entry);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetAuditLogDB
    // Method Description    :   Latest entries, newest first.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of AuditLogDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetAuditLogDB : </c> Latest entries, newest first.
    /// </summary>
    public async Task<List<AuditLogDocument>> GetAuditLogDB(int limit)
    {
        return await context.AuditLog.Find(FilterDefinition<AuditLogDocument>.Empty).SortByDescending(x => x.At).Limit(limit).ToListAsync();
    }
}
