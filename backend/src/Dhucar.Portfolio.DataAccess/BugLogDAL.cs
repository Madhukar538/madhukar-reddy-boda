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
 * Description     :  Reads and saves the site's bug log document.
 */
public class BugLogDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetBugLogDB
    // Method Description    :   The site's bug log, or null when none is saved.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   BugLogDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetBugLogDB : </c> The site's bug log, or null when none is saved.
    /// </summary>
    public async Task<BugLogDocument?> GetBugLogDB()
    {
        return await context.BugLogs.Find(x => x.Id == BugLogDocument.DocumentId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertBugLogDB
    // Method Description    :   Saves the site's bug log, replacing the earlier one.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   bugLog
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertBugLogDB : </c> Saves the site's bug log, replacing the earlier one.
    /// </summary>
    public async Task UpsertBugLogDB(BugLogDocument bugLog)
    {
        bugLog.Id = BugLogDocument.DocumentId;
        await context.BugLogs.ReplaceOneAsync(x => x.Id == BugLogDocument.DocumentId, bugLog, new ReplaceOptions { IsUpsert = true });
    }
}
