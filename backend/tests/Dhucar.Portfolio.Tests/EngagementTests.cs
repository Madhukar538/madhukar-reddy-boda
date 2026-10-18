using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class EngagementTests
{
    private const string Slug = "mcp-server-code-database-intelligence";
    private const string OtherSlug = "rag-chatbot-latency-audit";
    private const string Browser = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15";

    private static ApiFactory Factory() => new(new() { ["Portfolio:Security:CommentsPerMinute"] = "1000" });

    private static Task<ApiResult> Track(HttpClient client, string path) =>
        client.Post("TrackPageView", new { path }, headers: new() { ["User-Agent"] = Browser });

    private static Task<ApiResult> Comment(HttpClient client, string name, string body, string slug = Slug, string website = "", long elapsedMs = 8000) =>
        client.Post("AddComment", new { slug, name, body, website, elapsedMs });

    [Fact]
    public async Task Unknown_posts_are_rejected()
    {
        using ApiFactory factory = Factory();
        HttpClient client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.NotFound, (await client.Post("GetPostEngagement", new { slug = "no-such-post" })).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await client.Post("ReactToPost", new { slug = "no-such-post", reaction = "like", isAdded = true })).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await Comment(client, "Asha", "Nice post.", slug: "no-such-post")).Status);
    }

    [Fact]
    public async Task Tracked_views_of_a_post_become_its_read_count()
    {
        using ApiFactory factory = Factory();
        HttpClient client = factory.CreateApiClient();
        await Track(client, $"/blog/{Slug}");
        await Track(client, $"/blog/{Slug}?utm_source=x");
        await Track(client, "/blog/not-a-real-post");
        await Track(client, $"/blog/{OtherSlug}");

        ApiResult result = await client.Post("GetPostEngagement", new { slug = Slug });
        Assert.Equal(HttpStatusCode.OK, result.Status);
        Assert.Equal(2, result.Data.GetProperty("reads").GetInt64());

        ApiResult popular = await client.Post("GetPopularPosts", new { limit = 5 });
        List<string> slugs = popular.Data.EnumerateArray().Select(x => x.GetProperty("slug").GetString()!).ToList();
        Assert.Equal([Slug, OtherSlug], slugs);
        Assert.False(string.IsNullOrEmpty(popular.Data[0].GetProperty("title").GetString()));
    }

    [Fact]
    public async Task Reactions_count_up_and_down_but_never_below_zero()
    {
        using ApiFactory factory = Factory();
        HttpClient client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.OK, (await client.Post("ReactToPost", new { slug = Slug, reaction = "like", isAdded = true })).Status);
        await client.Post("ReactToPost", new { slug = Slug, reaction = "like", isAdded = true });
        await client.Post("ReactToPost", new { slug = Slug, reaction = "like", isAdded = false });
        await client.Post("ReactToPost", new { slug = Slug, reaction = "fire", isAdded = false });
        Assert.Equal(HttpStatusCode.BadRequest, (await client.Post("ReactToPost", new { slug = Slug, reaction = "angry", isAdded = true })).Status);

        JsonElement reactions = (await client.Post("GetPostEngagement", new { slug = Slug })).Data.GetProperty("reactions");
        Assert.Equal(1, reactions.GetProperty("like").GetInt64());
        Assert.Equal(0, reactions.GetProperty("fire").GetInt64());
        Assert.Equal(0, reactions.GetProperty("love").GetInt64());
    }

    [Fact]
    public async Task Comments_stay_hidden_until_approved_and_the_owner_is_alerted()
    {
        using ApiFactory factory = Factory();
        HttpClient visitor = factory.CreateApiClient();
        ApiResult added = await Comment(visitor, "  Asha  ", "Great write-up.\r\n\r\n\r\n\r\nThe MCP part helped.\u0007");
        Assert.Equal(HttpStatusCode.OK, added.Status);
        Assert.Empty((await visitor.Post("GetPostEngagement", new { slug = Slug })).Data.GetProperty("comments").EnumerateArray());

        (Uri url, _, string body) = Assert.Single(factory.Alerts.Requests);
        Assert.Contains("api.telegram.org", url.Host);
        Assert.Contains("Asha", Uri.UnescapeDataString(body));

        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult pending = await session.Client.Post("GetComments", new { status = "pending" }, token: session.AccessToken);
        JsonElement item = Assert.Single(pending.Data.GetProperty("items").EnumerateArray());
        Assert.Equal("Asha", item.GetProperty("name").GetString());
        Assert.Equal("Great write-up.\n\nThe MCP part helped.", item.GetProperty("body").GetString());
        Assert.False(string.IsNullOrEmpty(item.GetProperty("postTitle").GetString()));

        string id = item.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("ModerateComment", new { id, action = "approve" }, token: session.AccessToken)).Status);
        JsonElement shown = Assert.Single((await visitor.Post("GetPostEngagement", new { slug = Slug })).Data.GetProperty("comments").EnumerateArray());
        Assert.Equal("Asha", shown.GetProperty("name").GetString());

        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("ModerateComment", new { id, action = "delete" }, token: session.AccessToken)).Status);
        Assert.Empty((await visitor.Post("GetPostEngagement", new { slug = Slug })).Data.GetProperty("comments").EnumerateArray());
    }

    [Fact]
    public async Task Bots_and_bad_input_are_handled()
    {
        using ApiFactory factory = Factory();
        HttpClient visitor = factory.CreateApiClient();
        // A filled hidden field or an instant submit looks accepted, but nothing is stored.
        Assert.Equal(HttpStatusCode.OK, (await Comment(visitor, "Bot", "Buy now", website: "https://spam.example")).Status);
        Assert.Equal(HttpStatusCode.OK, (await Comment(visitor, "Bot", "Buy now", elapsedMs: 200)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Comment(visitor, "", "No name")).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Comment(visitor, "Asha", new string('x', 2001))).Status);
        // Link-heavy comments are kept apart as spam, without an alert.
        Assert.Equal(HttpStatusCode.OK, (await Comment(visitor, "Seo", "https://a.example https://b.example www.c.example")).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult all = await session.Client.Post("GetComments", new { status = "all" }, token: session.AccessToken);
        JsonElement only = Assert.Single(all.Data.GetProperty("items").EnumerateArray());
        Assert.Equal("spam", only.GetProperty("status").GetString());
        Assert.Empty(factory.Alerts.Requests);
    }

    [Fact]
    public async Task Moderation_needs_a_session_and_pages_through_comments()
    {
        using ApiFactory factory = Factory();
        HttpClient visitor = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await visitor.Post("GetComments", new { status = "pending" })).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await visitor.Post("ModerateComment", new { id = "x", action = "approve" })).Status);

        for (int i = 1; i <= 25; i++)
        {
            await Comment(visitor, $"Reader {i}", $"Comment number {i}.");
        }
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult page = await session.Client.Post("GetComments", new { status = "pending", page = 3, pageSize = 10 }, token: session.AccessToken);
        Assert.Equal(25, page.Data.GetProperty("totalCount").GetInt64());
        Assert.Equal(3, page.Data.GetProperty("totalPages").GetInt32());
        Assert.Equal(3, page.Data.GetProperty("page").GetInt32());
        Assert.Equal(5, page.Data.GetProperty("items").GetArrayLength());
        // Newest first: the last page holds the earliest comments.
        Assert.Equal("Reader 1", page.Data.GetProperty("items")[4].GetProperty("name").GetString());

        ApiResult clamped = await session.Client.Post("GetComments", new { status = "pending", page = 0, pageSize = 5000 }, token: session.AccessToken);
        Assert.Equal(1, clamped.Data.GetProperty("page").GetInt32());
        Assert.Equal(100, clamped.Data.GetProperty("pageSize").GetInt32());
    }
}
