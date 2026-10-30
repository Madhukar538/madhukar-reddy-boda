using Dhucar.Portfolio.BusinessLogic;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.DataAccess;
using MongoDB.Driver;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  30 Oct 2026
 * Modified Reason :  Runs the release's pending data migrations; keeps the API up and retries while the database is unreachable.
 * Layer           :  Services
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  On start: creates MongoDB indexes, seeds an empty database from the exported site content, and runs pending data migrations.
 *                    If the database can't be reached (e.g. the server's IP isn't on the Atlas access list yet), the API
 *                    still starts and these run in the background, retrying with backoff until they succeed.
 */
public class StartupTasks(IServiceProvider serviceProvider, ILogger<StartupTasks> logger) : IHostedService
{
    private static readonly TimeSpan FirstRetry = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan MaxRetry = TimeSpan.FromMinutes(5);

    private readonly CancellationTokenSource _stopping = new();
    private Task? _retrying;

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
    //  1.4        Boda Madhukar Reddy    30 Oct 2026       Starts without the database; retries in the background
    //****************************************************************************************************
    /// <summary>
    /// <c>StartAsync : </c> Ensures indexes and the settings document, seeds, then migrates.
    /// </summary>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await RunAll();
        }
        catch (Exception ex) when (ex is MongoException or TimeoutException)
        {
            // Don't take the whole API down with the database: /health keeps answering (db: down) meanwhile.
            logger.LogWarning(ex, "Database unreachable at start; retrying startup tasks in the background");
            // Maybe this server's IP isn't on the Atlas access list yet: sync it now rather than at the next check.
            serviceProvider.GetRequiredService<AtlasSyncTrigger>().Request();
            _retrying = Task.Run(() => RetryUntilDone(_stopping.Token));
        }
    }

    /// <summary>Retries the startup tasks with backoff (10 s, doubling to 5 min) until they succeed or the API stops.</summary>
    private async Task RetryUntilDone(CancellationToken stoppingToken)
    {
        TimeSpan wait = FirstRetry;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(wait, stoppingToken);
                await RunAll();
                logger.LogInformation("Startup tasks completed after the database became reachable");
                return;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex) when (ex is MongoException or TimeoutException)
            {
                logger.LogWarning("Database still unreachable; next try in {Seconds} s", (int)wait.TotalSeconds);
                serviceProvider.GetRequiredService<AtlasSyncTrigger>().Request();
                wait = TimeSpan.FromTicks(Math.Min(wait.Ticks * 2, MaxRetry.Ticks));
            }
        }
    }

    /// <summary>Indexes, the settings document, the seed, the read-count backfill and pending migrations, in that order.</summary>
    private async Task RunAll()
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
    // Method Description    :   Stops a background retry, if one is running.
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
    /// <c>StopAsync : </c> Stops a background retry, if one is running.
    /// </summary>
    public async Task StopAsync(CancellationToken cancellationToken)
    {
        await _stopping.CancelAsync();
        if (_retrying != null)
        {
            await _retrying.WaitAsync(cancellationToken);
        }
    }
}
