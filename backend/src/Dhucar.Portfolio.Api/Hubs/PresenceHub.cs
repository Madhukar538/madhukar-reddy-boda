using System.Text.RegularExpressions;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.BusinessLogic.Presence;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Hubs;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Api
 * Modified By     :
 * Description     :  Live presence on blog posts (/hubs/presence): readers join a post, report how far down they are and
 *                    send reactions that float up for everyone else on it. Anonymous, rate limited, only from the site.
 */
public partial class PresenceHub(PresenceTracker tracker, EngagementBAL engagementBAL, IOptions<PortfolioSettings> options, TimeProvider timeProvider) : Hub
{
    [GeneratedRegex("^[a-z0-9][a-z0-9-]{0,119}$")]
    private static partial Regex SlugPattern();

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   OnConnectedAsync
    // Method Description    :   Turns away connections that don't come from the site's own pages.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>OnConnectedAsync : </c> Turns away connections that don't come from the site's own pages.
    /// </summary>
    public override Task OnConnectedAsync()
    {
        // WebSockets skip CORS, so check the page's origin here.
        string origin = Context.GetHttpContext()?.Request.Headers.Origin.ToString() ?? string.Empty;
        if (!options.Value.Security.AllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            Context.Abort();
        }
        return Task.CompletedTask;
    }

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   Join
    // Method Description    :   Starts counting this reader on a published post and sends them who else is there.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Join : </c> Starts counting this reader on a published post and sends them who else is there.
    /// </summary>
    public async Task Join(string slug)
    {
        slug = (slug ?? string.Empty).Trim();
        if (!SlugPattern().IsMatch(slug) || !await engagementBAL.IsPublishedPost(slug))
        {
            return;
        }
        string? previous = tracker.Leave(Context.ConnectionId);
        if (previous != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, Group(previous));
        }
        if (!tracker.Join(Context.ConnectionId, slug))
        {
            return;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId, Group(slug));
        await Clients.Caller.SendAsync("presence", tracker.Snapshot(slug));
    }

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   Leave
    // Method Description    :   Stops counting this reader (their tab went to the background).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Leave : </c> Stops counting this reader (their tab went to the background).
    /// </summary>
    public async Task Leave()
    {
        string? slug = tracker.Leave(Context.ConnectionId);
        if (slug != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, Group(slug));
        }
    }

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   Move
    // Method Description    :   Records how far down the post this reader is (0-100); everyone sees it on the next tick.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   position
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Move : </c> Records how far down the post this reader is (0-100); everyone sees it on the next tick.
    /// </summary>
    public void Move(int position)
    {
        tracker.Move(Context.ConnectionId, position, timeProvider.GetUtcNow().UtcTicks);
    }

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   React
    // Method Description    :   Floats a reaction up for everyone else on the post (the count itself is saved by ReactToPost).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   reaction
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>React : </c> Floats a reaction up for everyone else on the post (the count itself is saved by ReactToPost).
    /// </summary>
    public async Task React(string reaction)
    {
        if (!EngagementBAL.Reactions.Contains(reaction))
        {
            return;
        }
        string? slug = tracker.TryReact(Context.ConnectionId, timeProvider.GetUtcNow().UtcTicks);
        if (slug != null)
        {
            await Clients.OthersInGroup(Group(slug)).SendAsync("reaction", reaction);
        }
    }

    //****************************************************************************************************
    // Layer                 :   Api
    // Method Name           :   OnDisconnectedAsync
    // Method Description    :   Stops counting a reader whose page closed or lost its connection.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   exception
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>OnDisconnectedAsync : </c> Stops counting a reader whose page closed or lost its connection.
    /// </summary>
    public override Task OnDisconnectedAsync(Exception? exception)
    {
        tracker.Leave(Context.ConnectionId);
        return Task.CompletedTask;
    }

    /// <summary>The SignalR group for a post's readers.</summary>
    public static string Group(string slug)
    {
        return "post:" + slug;
    }
}
