using Dhucar.Portfolio.BusinessLogic.BAL;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Api
 * Modified By     :
 * Description     :  Every half hour, checks what the backup services last recorded and sends a Telegram alert for each
 *                    new problem (BackupAlertBAL). Quiet when the backups are fine or not set up.
 */
public class BackupWatcher(IServiceProvider serviceProvider, ILogger<BackupWatcher> logger) : BackgroundService
{
    private static readonly TimeSpan Tick = TimeSpan.FromMinutes(30);

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   ExecuteAsync
    // Method Description    :   Checks the backups a minute after start, then every half hour.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   stoppingToken
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ExecuteAsync : </c> Checks the backups a minute after start, then every half hour.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            using PeriodicTimer timer = new(Tick);
            do
            {
                try
                {
                    using IServiceScope scope = serviceProvider.CreateScope();
                    await scope.ServiceProvider.GetRequiredService<BackupAlertBAL>().CheckAndAlert();
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "Backup check failed");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException)
        {
            // Shutting down.
        }
    }
}
