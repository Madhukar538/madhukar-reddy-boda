using Dhucar.Portfolio.BusinessLogic;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :  30 Oct 2026
 * Modified Reason :  Near-instant: checks the IP every 30 s and syncs at once when MongoDB stops answering
 * Layer           :  Api
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  When Portfolio:Atlas is configured, keeps this server's public IP on the MongoDB Atlas access
 *                    list (AtlasAccessListBAL), so a changed home IP heals itself within seconds:
 *                    - looks up the public IP every CheckSeconds (30 s) and calls Atlas only when it changed;
 *                    - syncs immediately when asked (AtlasSyncTrigger: the database stopped answering);
 *                    - re-checks the list in Atlas every ReconcileMinutes (15) anyway, to repair a removed entry.
 */
public class AtlasAccessListSync(
    IServiceProvider serviceProvider,
    AtlasSyncTrigger trigger,
    IOptions<PortfolioSettings> options,
    ILogger<AtlasAccessListSync> logger) : BackgroundService
{
    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   ExecuteAsync
    // Method Description    :   The check loop: IP lookup every few seconds, Atlas only on a change, a request or reconcile time.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   stoppingToken
    // Modified Date         :   30 Oct 2026
    // Modified Reason       :   Near-instant sync
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //  1.1        Boda Madhukar Reddy    30 Oct 2026       30 s IP checks, sync on request
    //****************************************************************************************************
    /// <summary>
    /// <c>ExecuteAsync : </c> The check loop: IP lookup every few seconds, Atlas only on a change, a request or reconcile time.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        AtlasSettings atlas = options.Value.Atlas;
        if (!atlas.IsEnabled)
        {
            // Not set up: say so only if it was half set up, so a typo in Coolify is easy to spot.
            if (atlas.IsAnySet)
            {
                logger.LogWarning("Atlas access list sync is off: {Missing} not set", string.Join(", ", atlas.Missing()));
            }
            return;
        }
        TimeSpan check = TimeSpan.FromSeconds(Math.Clamp(atlas.CheckSeconds, 10, 3600));
        TimeSpan reconcile = TimeSpan.FromMinutes(Math.Clamp(atlas.ReconcileMinutes, 1, 1440));
        string? syncedIp = null;
        DateTime reconcileAt = DateTime.MinValue;
        bool isRequested = true;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                AtlasAccessListBAL sync = scope.ServiceProvider.GetRequiredService<AtlasAccessListBAL>();
                string ip = await sync.PublicIp(stoppingToken);
                if (isRequested || ip != syncedIp || DateTime.UtcNow >= reconcileAt)
                {
                    string result = await sync.SyncOnce(ip, stoppingToken);
                    if (result != "unchanged")
                    {
                        logger.LogInformation("Atlas access list: {Result}", result);
                    }
                    syncedIp = ip;
                    reconcileAt = DateTime.UtcNow + reconcile;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Try again at the next check (not after the full reconcile interval).
                syncedIp = null;
                logger.LogWarning(ex, "Atlas access list sync failed; retrying in {Seconds} s", (int)check.TotalSeconds);
            }
            isRequested = await trigger.WaitAsync(check, stoppingToken);
        }
    }
}
