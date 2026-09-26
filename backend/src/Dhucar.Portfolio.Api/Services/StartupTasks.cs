using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.DataAccess;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Services
 * Modified By     :
 * Description     :  On start: creates MongoDB indexes and seeds an empty database from the exported site content.
 */
public class StartupTasks(IServiceProvider serviceProvider) : IHostedService
{
    //****************************************************************************************************
    // Layer                 :   Services
    // Method Name           :   StartAsync
    // Method Description    :   Ensures indexes, then seeds.
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
    /// <c>StartAsync : </c> Ensures indexes, then seeds.
    /// </summary>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await serviceProvider.GetRequiredService<MongoContext>().EnsureIndexes();
        using IServiceScope scope = serviceProvider.CreateScope();
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
