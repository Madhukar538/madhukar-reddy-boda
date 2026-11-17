using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>The Sites console: only the platform's own admin lists, creates, suspends and reactivates sites.</summary>
public class SitesConsoleTests
{
    [Fact]
    public async Task The_primary_admin_manages_sites_and_nobody_else_can()
    {
        using ApiFactory factory = new();
        string slug = "site-" + Guid.NewGuid().ToString("N")[..10];
        HttpClient anonymous = factory.CreateApiClient();
        foreach (string action in new[] { "GetSites", "CreateSite", "SetSiteStatus" })
        {
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post(action, new { slug, name = "X", status = "suspended" })).Status);
        }

        AdminSession admin = await AdminSession.SignedIn(factory);
        ApiResult created = await admin.Client.Post("CreateSite", new { slug, name = "Asha", hosts = new[] { slug + ".example.com" } }, token: admin.AccessToken);
        Assert.Equal(HttpStatusCode.OK, created.Status);
        string setupToken = created.Data.GetProperty("setupToken").GetString()!;
        Assert.True(setupToken.Length >= 40);

        // Listed without its token or hash.
        ApiResult list = await admin.Client.Post("GetSites", token: admin.AccessToken);
        Assert.Contains(list.Data.EnumerateArray(), x => x.GetProperty("id").GetString() == slug && x.GetProperty("status").GetString() == "active");
        Assert.DoesNotContain(setupToken, list.Body.GetRawText());
        Assert.DoesNotContain("setupTokenHash", list.Body.GetRawText());

        // Suspended: the site answers like an unknown one; reactivated: it's back.
        Dictionary<string, string> site = new() { ["X-Tenant"] = slug };
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.Post("SetSiteStatus", new { slug, status = "suspended" }, token: admin.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.Post("GetPosts", headers: site)).Status);
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.Post("SetSiteStatus", new { slug, status = "active" }, token: admin.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.OK, (await anonymous.Post("GetPosts", headers: site)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.Client.Post("SetSiteStatus", new { slug, status = "deleted" }, token: admin.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.Client.Post("SetSiteStatus", new { slug = "no-such-site", status = "suspended" }, token: admin.AccessToken)).Status);

        // Another site's own admin can't manage sites, not even its own.
        AdminSession other = await AdminSession.SignedIn(factory, slug, setupToken);
        foreach (string action in new[] { "GetSites", "CreateSite", "SetSiteStatus" })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await other.Client.Post(action, new { slug = "site-zzzzzzzz", name = "Z", status = "suspended" }, token: other.AccessToken)).Status);
        }
    }
}
