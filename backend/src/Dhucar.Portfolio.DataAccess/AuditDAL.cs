using System.Text.RegularExpressions;
using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Paged, searchable audit list
 * Layer           :  DataAccess
 * Modified By     :  Boda Madhukar Reddy
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

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetAuditPageDB
    // Method Description    :   One page of audit entries, newest first; matches text in action, email or detail.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   search, skip, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (List of AuditLogDocument, total)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetAuditPageDB : </c> One page of audit entries, newest first; matches text in action, email or detail.
    /// </summary>
    public async Task<(List<AuditLogDocument> Items, long Total)> GetAuditPageDB(string search, int skip, int limit)
    {
        FilterDefinitionBuilder<AuditLogDocument> builder = Builders<AuditLogDocument>.Filter;
        FilterDefinition<AuditLogDocument> filter = builder.Empty;
        if (search.Length > 0)
        {
            BsonRegularExpression pattern = new BsonRegularExpression(Regex.Escape(search), "i");
            filter = builder.Or(builder.Regex(x => x.Action, pattern), builder.Regex(x => x.Email, pattern), builder.Regex(x => x.Detail, pattern));
        }
        long total = await context.AuditLog.CountDocumentsAsync(filter);
        List<AuditLogDocument> items = await context.AuditLog.Find(filter).SortByDescending(x => x.At).Skip(skip).Limit(limit).ToListAsync();
        return (items, total);
    }
}
