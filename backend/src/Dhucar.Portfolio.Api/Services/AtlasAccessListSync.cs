using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Api
 * Modified By     :
 * Description     :  When Portfolio:Atlas is configured: on start and then every few minutes, keeps this server's
 *                    public IP on the MongoDB Atlas access list (AtlasAccessListBAL), so a changed home IP heals itself.
 */
public class AtlasAccessListSync(IServiceProvider serviceProvider, IOptions<PortfolioSettings> options, ILogger<AtlasAccessListSync> logger) : BackgroundService
{
    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   ExecuteAsync
    // Method Description    :   Syncs at once, then on every interval; a failure is logged and retried next time.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   stoppingToken
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ExecuteAsync : </c> Syncs at once, then on every interval; a failure is logged and retried next time.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        AtlasSettings atlas = options.Value.Atlas;
        if (!atlas.IsEnabled)
        {
            return;
        }
        using PeriodicTimer timer = new(TimeSpan.FromMinutes(atlas.IntervalMinutes));
        do
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                string result = await scope.ServiceProvider.GetRequiredService<AtlasAccessListBAL>().SyncOnce(stoppingToken);
                if (result != "unchanged")
                {
                    logger.LogInformation("Atlas access list: {Result}", result);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Atlas access list sync failed; retrying in {Minutes} min", atlas.IntervalMinutes);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
