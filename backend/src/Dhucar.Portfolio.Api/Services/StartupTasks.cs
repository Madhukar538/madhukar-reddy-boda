using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.DataAccess;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  26 Sep 2026
 * Modified Reason :  Creates the security settings document on start.
 * Layer           :  Services
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  On start: creates MongoDB indexes and seeds an empty database from the exported site content.
 */
public class StartupTasks(IServiceProvider serviceProvider) : IHostedService
{
    //****************************************************************************************************
    // Layer                 :   Services
    // Method Name           :   StartAsync
    // Method Description    :   Ensures indexes and the settings document, then seeds.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   cancellationToken
    // Modified Date         :   26 Sep 2026
    // Modified Reason       :   Creates the security settings document on start.
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Settings document
    //****************************************************************************************************
    /// <summary>
    /// <c>StartAsync : </c> Ensures indexes and the settings document, then seeds.
    /// </summary>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await serviceProvider.GetRequiredService<MongoContext>().EnsureIndexes();
        using IServiceScope scope = serviceProvider.CreateScope();
        // Creates settings/security with its defaults, so the switches are there to flip in the database.
        await scope.ServiceProvider.GetRequiredService<SettingsDAL>().EnsureSecuritySettingsDB();
        await scope.ServiceProvider.GetRequiredService<SeedBAL>().SeedIfEmpty();
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
