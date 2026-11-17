using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>One database per site: no site sees another's data, sign-ins don't cross sites, and the primary site is unchanged.</summary>
public class TenancyTests
{
    /// <summary>Slugs are unique per test run: every test shares one MongoDB server, and a site's database is named after its slug.</summary>
    private static string NewSlug() => "site-" + Guid.NewGuid().ToString("N")[..10];

    private static async Task<ApiResultLike> Provision(ApiFactory factory, string slug, string name = "Asha", params string[] hosts)
    {
        using IServiceScope scope = factory.Services.CreateScope();
        Properties.Response<object> result = await scope.ServiceProvider.GetRequiredService<TenantBAL>().Provision(new ProvisionTenantRequestDTO { Slug = slug, Name = name, Hosts = hosts.ToList() });
        return new ApiResultLike(result.ReturnCode, result.ReturnMessage);
    }

    private sealed record ApiResultLike(int ReturnCode, string ReturnMessage);

    private static Dictionary<string, string> Site(string slug) => new() { ["X-Tenant"] = slug };

    [Fact]
    public async Task Each_site_reads_and_writes_only_its_own_database()
    {
        using ApiFactory factory = new();
        string slug = NewSlug();
        string host = slug + ".example.com";
        Assert.Equal(1, (await Provision(factory, slug, "Asha", host)).ReturnCode);
        HttpClient client = factory.CreateApiClient();

        // The primary site still has its seeded posts; the new site starts empty, by header or by its browser origin.
        Assert.True((await client.Post("GetPosts")).Data.GetArrayLength() > 0);
        Assert.Equal(0, (await client.Post("GetPosts", headers: Site(slug))).Data.GetArrayLength());
        Assert.Equal(0, (await client.Post("GetPosts", headers: new() { ["Origin"] = "https://" + host })).Data.GetArrayLength());

        // A ticket filed for the new site lands in its database, not the primary one.
        string body = JsonSerializer.Serialize(new { id = "BUG-261117-SITE01", name = "A", contact = "a@example.com", category = "Bug", title = "T", description = "D", urgency = "Low", priority = "P4" },
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        string timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        Dictionary<string, string> signed = Site(slug);
        signed["X-Timestamp"] = timestamp;
        signed["X-Signature"] = RequestSigner.Sign(ApiFactory.RevalidateSecret, timestamp, body);
        Assert.Equal(HttpStatusCode.OK, (await client.Post("CreateTicket", body, headers: signed)).Status);
        IMongoDatabase siteDatabase = factory.Database.Client.GetDatabase("site_" + slug);
        Assert.Equal(1, await siteDatabase.GetCollection<BsonDocument>("tickets").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty));
        Assert.Equal(0, await factory.Database.GetCollection<BsonDocument>("tickets").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty));
        // Its own default switches were created with it.
        Assert.Equal(1, await siteDatabase.GetCollection<BsonDocument>("settings").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty));
    }

    [Fact]
    public async Task A_sign_in_works_only_on_its_own_site()
    {
        using ApiFactory factory = new();
        string slug = NewSlug();
        await Provision(factory, slug);
        AdminSession session = await AdminSession.SignedIn(factory);

        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("GetTickets", new { }, token: session.AccessToken)).Status);
        // The primary site's token, presented to another site, is refused.
        Assert.Equal(HttpStatusCode.Unauthorized, (await session.Client.Post("GetTickets", new { }, token: session.AccessToken, headers: Site(slug))).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await session.Client.Post("GetCurrentAdmin", new { }, token: session.AccessToken, headers: Site(slug))).Status);
    }

    [Fact]
    public async Task Unknown_or_malformed_sites_are_turned_away()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        foreach (string named in new[] { "nobody-here-yet", "../admin", "MAIN$", "site_x" })
        {
            ApiResult result = await client.Post("GetPosts", headers: Site(named));
            Assert.Equal(HttpStatusCode.NotFound, result.Status);
            Assert.Equal("Unknown site.", result.Body.GetProperty("returnMessage").GetString());
        }
        // "main" is the primary site by name, and an origin no site claims is the primary site too.
        Assert.True((await client.Post("GetPosts", headers: Site("main"))).Data.GetArrayLength() > 0);
        Assert.True((await client.Post("GetPosts", headers: new() { ["Origin"] = "https://unclaimed.example.org" })).Data.GetArrayLength() > 0);
    }

    [Fact]
    public async Task New_sites_need_a_free_valid_slug_and_hosts()
    {
        using ApiFactory factory = new();
        string slug = NewSlug();
        string host = slug + ".example.com";
        Assert.Equal(1, (await Provision(factory, slug, "First", host)).ReturnCode);
        Assert.Equal(-6, (await Provision(factory, slug, "Same slug")).ReturnCode);
        Assert.Equal(-6, (await Provision(factory, NewSlug(), "Same host", host)).ReturnCode);
        foreach (string reserved in new[] { "main", "api", "admin", "www" })
        {
            Assert.Equal(-1, (await Provision(factory, reserved)).ReturnCode);
        }
        Assert.Equal(-1, (await Provision(factory, "9starts-with-digit")).ReturnCode);
        Assert.Equal(-1, (await Provision(factory, "has.dot")).ReturnCode);
        Assert.Equal(-1, (await Provision(factory, NewSlug(), "Bad host", "not a host")).ReturnCode);
        Assert.Equal(-1, (await Provision(factory, NewSlug(), "Scheme in host", "https://x.example.com")).ReturnCode);
        Assert.Equal(-1, (await Provision(factory, NewSlug(), string.Empty)).ReturnCode);
        // Two sites without hosts yet don't collide.
        Assert.Equal(1, (await Provision(factory, NewSlug(), "No host 1")).ReturnCode);
        Assert.Equal(1, (await Provision(factory, NewSlug(), "No host 2")).ReturnCode);
    }

    [Fact]
    public async Task Each_site_has_its_own_setup_token()
    {
        using ApiFactory factory = new();
        string first = NewSlug();
        string second = NewSlug();
        string firstToken;
        string secondToken;
        using (IServiceScope scope = factory.Services.CreateScope())
        {
            TenantBAL tenants = scope.ServiceProvider.GetRequiredService<TenantBAL>();
            firstToken = ((Properties.ProvisionResultDTO)(await tenants.Provision(new ProvisionTenantRequestDTO { Slug = first, Name = "First" })).Data!).SetupToken;
            secondToken = ((Properties.ProvisionResultDTO)(await tenants.Provision(new ProvisionTenantRequestDTO { Slug = second, Name = "Second" })).Data!).SetupToken;
        }
        Assert.True(firstToken.Length >= 40);
        Assert.NotEqual(firstToken, secondToken);
        // Only the hash is stored.
        Assert.DoesNotContain(firstToken, (await factory.Database.GetCollection<BsonDocument>("tenants").Find(new BsonDocument("_id", first)).FirstAsync()).ToJson());

        HttpClient client = factory.CreateApiClient();
        object Setup(string token) => new { setupToken = token, email = "owner@example.com", password = "correct horse battery staple 42" };
        // The server's token, another site's token, or nothing: refused on a site.
        foreach (string wrong in new[] { ApiFactory.SetupToken, secondToken, string.Empty })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await client.Post("SetupAdmin", Setup(wrong), headers: Site(first))).Status);
        }
        // A site's token doesn't work on the primary site either.
        Assert.Equal(HttpStatusCode.Forbidden, (await client.Post("SetupAdmin", Setup(firstToken))).Status);
        // Its own token does.
        Assert.Equal(HttpStatusCode.OK, (await client.Post("SetupAdmin", Setup(firstToken), headers: Site(first))).Status);
    }
}
