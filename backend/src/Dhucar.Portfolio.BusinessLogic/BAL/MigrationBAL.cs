using Dhucar.Portfolio.BusinessLogic.Migrations;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.DataAccess;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Runs the data migrations a release ships (BusinessLogic/Migrations), each once per database.
 */
public class MigrationBAL(
    IEnumerable<IMigration> migrations,
    MigrationDAL migrationDAL,
    RevalidationBAL revalidationBAL,
    TimeProvider timeProvider,
    ICodeLogger codeLog)
{
    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   RunPending
    // Method Description    :   Applies, in Id order, every migration not yet recorded; then refreshes the site once.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Ids of the migrations applied this time
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RunPending : </c> Applies, in Id order, every migration not yet recorded; then refreshes the site once.
    /// </summary>
    public async Task<IReadOnlyList<string>> RunPending()
    {
        HashSet<string> applied = await migrationDAL.GetAppliedIdsDB();
        List<string> ran = new List<string>();
        HashSet<string> tags = new HashSet<string>(StringComparer.Ordinal);
        foreach (IMigration migration in migrations.OrderBy(x => x.Id, StringComparer.Ordinal))
        {
            if (applied.Contains(migration.Id))
            {
                continue;
            }
            // A failure stops here, unrecorded, so the next start retries it (and nothing after it runs first).
            tags.UnionWith(await migration.Apply());
            await migrationDAL.MarkAppliedDB(migration.Id, migration.Description, timeProvider.GetUtcNow().UtcDateTime);
            codeLog.Code($"Step {nameof(RunPending)}", $"Applied migration {migration.Id}");
            ran.Add(migration.Id);
        }
        if (tags.Count > 0)
        {
            await revalidationBAL.Revalidate(tags);
        }
        return ran;
    }
}
