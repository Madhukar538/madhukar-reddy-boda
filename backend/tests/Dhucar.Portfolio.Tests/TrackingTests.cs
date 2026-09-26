using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class TrackingTests
{
    private const string Browser = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

    private static Task<ApiResult> Track(HttpClient client, string path, Dictionary<string, string>? headers = null, string referrer = "https://www.google.com/search?q=secret")
    {
        Dictionary<string, string> all = new() { ["User-Agent"] = Browser };
        foreach (KeyValuePair<string, string> header in headers ?? new())
        {
            all[header.Key] = header.Value;
        }
        return client.Post("TrackPageView", new { path, referrer, utmSource = "LinkedIn" }, headers: all);
    }

    [Fact]
    public async Task Views_are_stored_without_personal_data()
    {
        using ApiFactory factory = new(new() { ["Portfolio:Security:IsCloudflareTrusted"] = "true" });
        HttpClient client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.OK, (await Track(client, "/blog/some-post?utm_source=x#top", new() { ["CF-Connecting-IP"] = "203.0.113.7", ["CF-IPCountry"] = "IN" })).Status);

        BsonDocument view = await factory.Database.GetCollection<BsonDocument>("pageViews").Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        string json = view.ToJson();
        Assert.DoesNotContain("203.0.113.7", json);
        Assert.DoesNotContain("iPhone", json);
        Assert.DoesNotContain("secret", json);
        Assert.Equal("/blog/some-post", view["Path"].AsString);
        Assert.Equal("google.com", view["ReferrerHost"].AsString);
        Assert.Equal("mobile", view["Device"].AsString);
        Assert.Equal("IN", view["Country"].AsString);
        Assert.Equal("linkedin", view["UtmSource"].AsString);
        Assert.Equal(24, view["VisitorHash"].AsString.Length);
    }

    [Fact]
    public async Task Do_not_track_bots_and_admin_paths_are_not_recorded()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        await Track(client, "/about", new() { ["DNT"] = "1" });
        await Track(client, "/about", new() { ["Sec-GPC"] = "1" });
        await Track(client, "/about", new() { ["User-Agent"] = "Mozilla/5.0 (compatible; Googlebot/2.1)" });
        Assert.Equal(HttpStatusCode.BadRequest, (await Track(client, "/admin/login")).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Track(client, "https://evil.example/")).Status);
        Assert.Equal(0, await factory.Database.GetCollection<BsonDocument>("pageViews").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty));
    }

    [Fact]
    public async Task Summary_counts_views_visitors_and_top_pages()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        HttpClient visitor = factory.CreateApiClient();
        await Track(visitor, "/");
        await Track(visitor, "/");
        await Track(visitor, "/blog/a");
        await Track(visitor, "/about", new() { ["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0" });

        ApiResult summary = await session.Client.Post("GetTrafficSummary", new { days = 7 }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, summary.Status);
        Assert.Equal(4, summary.Data.GetProperty("pageViews").GetInt64());
        Assert.Equal(2, summary.Data.GetProperty("visitors").GetInt64());
        Assert.Equal("/", summary.Data.GetProperty("topPages")[0].GetProperty("key").GetString());
        Assert.Equal(2, summary.Data.GetProperty("topPages")[0].GetProperty("count").GetInt64());
    }
}
