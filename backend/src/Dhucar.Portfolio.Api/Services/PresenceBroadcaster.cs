using Dhucar.Portfolio.Api.Hubs;
using Dhucar.Portfolio.BusinessLogic.Presence;
using Microsoft.AspNetCore.SignalR;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Api
 * Modified By     :
 * Description     :  Once a second, sends each post whose readers changed its new count and positions. Batching like this
 *                    keeps a busy post to one message per reader per second, however much everyone scrolls.
 */
public class PresenceBroadcaster(PresenceTracker tracker, IHubContext<PresenceHub> hub, ILogger<PresenceBroadcaster> logger) : BackgroundService
{
    private static readonly TimeSpan Tick = TimeSpan.FromSeconds(1);

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   ExecuteAsync
    // Method Description    :   The once-a-second loop that pushes changed posts to their readers.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   stoppingToken
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ExecuteAsync : </c> The once-a-second loop that pushes changed posts to their readers.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using PeriodicTimer timer = new(Tick);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            foreach (string slug in tracker.TakeChanged())
            {
                try
                {
                    await hub.Clients.Group(PresenceHub.Group(slug)).SendAsync("presence", tracker.Snapshot(slug), stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "Presence update for {Slug} failed", slug);
                }
            }
        }
    }
}
