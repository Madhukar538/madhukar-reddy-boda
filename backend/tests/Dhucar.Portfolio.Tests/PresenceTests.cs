using System.Collections.Concurrent;
using Dhucar.Portfolio.BusinessLogic.Presence;
using Dhucar.Portfolio.Tests.Infrastructure;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class PresenceTests
{
    private const string Slug = "mcp-server-code-database-intelligence";

    /// <summary>A reader's page: the presence and reaction messages it has received.</summary>
    private sealed class Reader : IAsyncDisposable
    {
        public required HubConnection Connection { get; init; }
        public ConcurrentQueue<PresenceSnapshot> Presence { get; } = new();
        public ConcurrentQueue<string> Reactions { get; } = new();

        public async Task<PresenceSnapshot> WaitFor(Func<PresenceSnapshot, bool> match)
        {
            for (int i = 0; i < 60; i++)
            {
                PresenceSnapshot? hit = Presence.LastOrDefault(match);
                if (hit != null)
                {
                    return hit;
                }
                await Task.Delay(100);
            }
            throw new TimeoutException("No matching presence update.");
        }

        public ValueTask DisposeAsync() => Connection.DisposeAsync();
    }

    private static async Task<Reader> Open(ApiFactory factory, string origin = ApiFactory.Origin)
    {
        HubConnection connection = new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, "hubs/presence"), options =>
            {
                // The test server has no WebSockets; long polling runs the same hub.
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                options.Headers["Origin"] = origin;
            })
            .Build();
        Reader reader = new() { Connection = connection };
        connection.On<PresenceSnapshot>("presence", reader.Presence.Enqueue);
        connection.On<string>("reaction", reader.Reactions.Enqueue);
        await connection.StartAsync();
        return reader;
    }

    [Fact]
    public async Task Readers_on_a_post_see_each_other_and_where_they_are()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();
        await using Reader first = await Open(factory);
        await using Reader second = await Open(factory);

        await first.Connection.InvokeAsync("Join", Slug);
        Assert.Equal(1, (await first.WaitFor(x => x.Count == 1)).Count);
        await second.Connection.InvokeAsync("Join", Slug);
        await first.WaitFor(x => x.Count == 2);

        await second.Connection.InvokeAsync("Move", 64);
        PresenceSnapshot moved = await first.WaitFor(x => x.Positions.Contains(64));
        Assert.Equal([0, 64], moved.Positions);

        // Out-of-range positions are clamped.
        await Task.Delay(300);
        await second.Connection.InvokeAsync("Move", 500);
        await first.WaitFor(x => x.Positions.Contains(100));

        // A tab in the background stops being counted.
        await second.Connection.InvokeAsync("Leave");
        await first.WaitFor(x => x.Count == 1);
    }

    [Fact]
    public async Task Reactions_float_to_everyone_else_with_limits()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();
        await using Reader sender = await Open(factory);
        await using Reader watcher = await Open(factory);
        await sender.Connection.InvokeAsync("Join", Slug);
        await watcher.Connection.InvokeAsync("Join", Slug);

        await sender.Connection.InvokeAsync("React", "fire");
        await sender.Connection.InvokeAsync("React", "love"); // within a second: dropped
        await sender.Connection.InvokeAsync("React", "<script>"); // not a reaction: dropped
        await Task.Delay(1500);
        Assert.Equal(["fire"], watcher.Reactions.ToArray());
        Assert.Empty(sender.Reactions);
    }

    [Fact]
    public async Task Unknown_posts_and_other_sites_are_turned_away()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();
        await using Reader reader = await Open(factory);
        await reader.Connection.InvokeAsync("Join", "no-such-post");
        await reader.Connection.InvokeAsync("Join", "../../etc/passwd");
        await Task.Delay(1500);
        Assert.Empty(reader.Presence);

        // A page on another site can't open a connection.
        await using Reader stranger = await Open(factory, origin: "https://evil.example");
        for (int i = 0; i < 30 && stranger.Connection.State != HubConnectionState.Disconnected; i++)
        {
            await Task.Delay(100);
        }
        Assert.Equal(HubConnectionState.Disconnected, stranger.Connection.State);
    }
}
