using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class ContentSyncTests
{
    private const string PostSlug = "mcp-server-code-database-intelligence";

    private static List<(string Type, string Id, string Change, string[] Fields)> Items(ApiResult result) =>
        result.Data.EnumerateArray()
            .Select(x => (
                x.GetProperty("type").GetString()!,
                x.GetProperty("id").GetString()!,
                x.GetProperty("change").GetString()!,
                x.GetProperty("fields").EnumerateArray().Select(f => f.GetString()!).ToArray()))
            .ToList();

    [Fact]
    public async Task Sync_needs_a_session()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("GetContentSync")).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("ApplyContentSync", new { items = new[] { new { type = "post", id = PostSlug } } })).Status);
    }

    [Fact]
    public async Task A_freshly_seeded_database_has_nothing_to_sync()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult result = await session.Client.Post("GetContentSync", token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, result.Status);
        Assert.Empty(Items(result));
    }

    [Fact]
    public async Task New_and_changed_items_are_listed_and_only_chosen_ones_are_applied()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        HttpClient client = session.Client;
        string token = session.AccessToken;

        // A post missing from the database (as if added to the code after the first seed)…
        Assert.Equal(HttpStatusCode.OK, (await client.Post("DeletePost", new { id = PostSlug }, token: token)).Status);
        // …and a project edited in the admin.
        ApiResult projects = await client.Post("GetAllProjects", token: token);
        JsonElement project = projects.Data.EnumerateArray().First(x => x.GetProperty("kind").GetString() == "key");
        string projectId = project.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await client.Post("SaveProject", new
        {
            id = projectId,
            kind = "key",
            title = project.GetProperty("title").GetString(),
            description = project.GetProperty("description").GetString(),
            tech = project.GetProperty("tech").EnumerateArray().Select(x => x.GetString()).ToArray(),
            post = project.GetProperty("post").GetString(),
            isFeatured = project.GetProperty("isFeatured").GetBoolean(),
            outcome = "Edited in the admin.",
            isPublished = true,
        }, token: token)).Status);

        List<(string Type, string Id, string Change, string[] Fields)> items = Items(await client.Post("GetContentSync", token: token));
        Assert.Contains(items, x => x.Type == "post" && x.Id == PostSlug && x.Change == "new");
        Assert.Contains(items, x => x.Type == "project" && x.Id == projectId && x.Change == "changed" && x.Fields.SequenceEqual(new[] { "outcome" }));
        Assert.Equal(2, items.Count);

        // Apply only the new post: the admin's project edit is left alone.
        ApiResult applied = await client.Post("ApplyContentSync", new { items = new[] { new { type = "post", id = PostSlug } } }, token: token);
        Assert.Equal(HttpStatusCode.OK, applied.Status);
        Assert.Equal(1, applied.Data.GetProperty("applied").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await client.Post("GetPost", new { slug = PostSlug })).Status);

        items = Items(await client.Post("GetContentSync", token: token));
        Assert.Single(items);
        Assert.Equal(projectId, items[0].Id);

        // Applying something that no longer differs is a no-op.
        ApplyAgain(await client.Post("ApplyContentSync", new { items = new[] { new { type = "post", id = PostSlug } } }, token: token));
    }

    private static void ApplyAgain(ApiResult result)
    {
        Assert.Equal(HttpStatusCode.OK, result.Status);
        Assert.Equal(0, result.Data.GetProperty("applied").GetInt32());
    }

    [Fact]
    public async Task Invalid_selections_are_rejected()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("ApplyContentSync", new { items = Array.Empty<object>() }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("ApplyContentSync", new { items = new[] { new { type = "user", id = "x" } } }, token: session.AccessToken)).Status);
    }
}
