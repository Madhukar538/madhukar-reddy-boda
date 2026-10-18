using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class ProfileNowTests
{
    private static async Task<Dictionary<string, object?>> Profile(HttpClient client) =>
        JsonSerializer.Deserialize<Dictionary<string, object?>>((await client.Post("GetProfile")).Data.GetRawText())!;

    private static DateTime? NowUpdatedAt(JsonElement profile) =>
        profile.GetProperty("nowUpdatedAt").ValueKind == JsonValueKind.Null ? null : profile.GetProperty("nowUpdatedAt").GetDateTime();

    [Fact]
    public async Task The_now_date_is_set_by_the_server_and_moves_only_when_the_text_changes()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        HttpClient client = session.Client;
        string token = session.AccessToken;

        // A changed note gets today's date, whatever date the client sends.
        Dictionary<string, object?> profile = await Profile(client);
        profile["now"] = "  Testing a faster model runtime.  ";
        profile["nowUpdatedAt"] = "2000-01-01T00:00:00Z";
        Assert.Equal(HttpStatusCode.OK, (await client.Post("SaveProfile", new { profile }, token: token)).Status);
        JsonElement saved = (await client.Post("GetProfile")).Data;
        Assert.Equal("Testing a faster model runtime.", saved.GetProperty("now").GetString());
        DateTime? changedAt = NowUpdatedAt(saved);
        Assert.NotNull(changedAt);
        Assert.True(DateTime.UtcNow - changedAt!.Value.ToUniversalTime() < TimeSpan.FromMinutes(1));

        // Saving other fields keeps the note's date.
        profile = await Profile(client);
        profile["summary"] = "Edited summary.";
        profile["nowUpdatedAt"] = "2000-01-01T00:00:00Z";
        Assert.Equal(HttpStatusCode.OK, (await client.Post("SaveProfile", new { profile }, token: token)).Status);
        Assert.Equal(changedAt, NowUpdatedAt((await client.Post("GetProfile")).Data));

        // Clearing the note clears its date.
        profile = await Profile(client);
        profile["now"] = string.Empty;
        Assert.Equal(HttpStatusCode.OK, (await client.Post("SaveProfile", new { profile }, token: token)).Status);
        Assert.Null(NowUpdatedAt((await client.Post("GetProfile")).Data));
    }

    [Fact]
    public async Task A_long_now_note_is_rejected()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        Dictionary<string, object?> profile = await Profile(session.Client);
        profile["now"] = new string('x', 281);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SaveProfile", new { profile }, token: session.AccessToken)).Status);
    }
}
