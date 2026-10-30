using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.DataAccess;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  30 Oct 2026
 * Modified Reason :  Runs the release's pending data migrations.
 * Layer           :  Services
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  On start: creates MongoDB indexes, seeds an empty database from the exported site content, and runs pending data migrations.
 */
public class StartupTasks(IServiceProvider serviceProvider) : IHostedService
{
    //****************************************************************************************************
    // Layer                 :   Services
    // Method Name           :   StartAsync
    // Method Description    :   Ensures indexes and the settings document, seeds, then migrates.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   cancellationToken
    // Modified Date         :   30 Oct 2026
    // Modified Reason       :   Runs pending data migrations.
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Settings document
    //  1.2        Boda Madhukar Reddy    18 Oct 2026       Read count backfill
    //  1.3        Boda Madhukar Reddy    30 Oct 2026       Data migrations
    //****************************************************************************************************
    /// <summary>
    /// <c>StartAsync : </c> Ensures indexes and the settings document, seeds, then migrates.
    /// </summary>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await serviceProvider.GetRequiredService<MongoContext>().EnsureIndexes();
        using IServiceScope scope = serviceProvider.CreateScope();
        // Creates settings/security with its defaults, so the switches are there to flip in the database.
        await scope.ServiceProvider.GetRequiredService<SettingsDAL>().EnsureSecuritySettingsDB();
        await scope.ServiceProvider.GetRequiredService<SeedBAL>().SeedIfEmpty();
        // Once: read counts start from the page views already stored.
        await scope.ServiceProvider.GetRequiredService<EngagementBAL>().BackfillReads();
        // Each release's data changes (BusinessLogic/Migrations), once per database.
        await scope.ServiceProvider.GetRequiredService<MigrationBAL>().RunPending();
    }

    //****************************************************************************************************
    // Layer                 :   Services
    // Method Name           :   StopAsync
    // Method Description    :   Nothing to stop.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   cancellationToken
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>StopAsync : </c> Nothing to stop.
    /// </summary>
    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
