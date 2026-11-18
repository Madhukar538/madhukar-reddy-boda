using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>Pages made in the admin: drafts hidden from the site, addresses checked, content sanitized, admin only.</summary>
public class PageTests
{
    private static object Page(string slug, bool isPublished = true, string originalSlug = "", string content = "<p>My desk and tools.</p>") => new
    {
        originalSlug,
        slug,
        title = "Uses",
        description = "What I work with.",
        content,
        isPublished,
    };

    [Fact]
    public async Task A_page_is_saved_by_the_admin_and_shown_only_once_published()
    {
        using ApiFactory factory = new();
        HttpClient anonymous = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("SavePage", Page("uses"))).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("GetAllPages")).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePage", Page("uses", isPublished: false), token: session.AccessToken)).Status);

        // A draft: in the admin, not on the site.
        Assert.Empty((await anonymous.Post("GetPages")).Data.EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.Post("GetPage", new { slug = "uses" })).Status);
        Assert.Single((await session.Client.Post("GetAllPages", token: session.AccessToken)).Data.EnumerateArray());
        Assert.Equal("<p>My desk and tools.</p>", (await session.Client.Post("GetPageForEdit", new { slug = "uses" }, token: session.AccessToken)).Data.GetProperty("content").GetString());

        // Published: on the site, and the site is told to refresh it.
        factory.Site.Requests.Clear();
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePage", Page("uses", originalSlug: "uses"), token: session.AccessToken)).Status);
        JsonElement page = (await anonymous.Post("GetPage", new { slug = "uses" })).Data;
        Assert.Equal("Uses", page.GetProperty("title").GetString());
        Assert.Equal("What I work with.", page.GetProperty("description").GetString());
        JsonElement listed = Assert.Single((await anonymous.Post("GetPages")).Data.EnumerateArray());
        Assert.Equal(string.Empty, listed.GetProperty("content").GetString());
        Assert.Contains(factory.Site.Requests, r => r.Body.Contains("\"page:uses\"", StringComparison.Ordinal) && r.Body.Contains("\"pages\"", StringComparison.Ordinal));

        // Linked from the footer, if asked; anything else is refused.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePage", new { originalSlug = "uses", slug = "uses", title = "Uses", description = "", content = "<p>x</p>", isPublished = true, showIn = "footer" }, token: session.AccessToken)).Status);
        Assert.Equal("footer", Assert.Single((await anonymous.Post("GetPages")).Data.EnumerateArray()).GetProperty("showIn").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SavePage", new { originalSlug = "uses", slug = "uses", title = "Uses", description = "", content = "<p>x</p>", isPublished = true, showIn = "sidebar" }, token: session.AccessToken)).Status);

        // Deleted: gone from the site.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("DeletePage", new { slug = "uses" }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.Post("GetPage", new { slug = "uses" })).Status);
    }

    [Fact]
    public async Task Addresses_are_checked_renames_move_the_page_and_content_is_sanitized()
    {
        using ApiFactory factory = new();
        HttpClient anonymous = factory.CreateApiClient();
        AdminSession session = await AdminSession.SignedIn(factory);

        // Not a valid address, or one the site already uses.
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SavePage", Page("Not Valid"), token: session.AccessToken)).Status);
        ApiResult reserved = await session.Client.Post("SavePage", Page("about"), token: session.AccessToken);
        Assert.Equal(HttpStatusCode.BadRequest, reserved.Status);
        Assert.Contains("/about is already a page", reserved.Body.GetProperty("returnMessage").GetString());

        // Scripts and event handlers are stripped.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePage", Page("uses", content: "<p onclick=\"x()\">Hi</p><script>alert(1)</script>"), token: session.AccessToken)).Status);
        string content = (await anonymous.Post("GetPage", new { slug = "uses" })).Data.GetProperty("content").GetString()!;
        Assert.DoesNotContain("script", content);
        Assert.DoesNotContain("onclick", content);

        // A second page can't take an address that is in use.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePage", Page("now"), token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.Conflict, (await session.Client.Post("SavePage", Page("now", originalSlug: "uses"), token: session.AccessToken)).Status);

        // Renaming moves it: the old address stops answering.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePage", Page("my-setup", originalSlug: "uses"), token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.Post("GetPage", new { slug = "uses" })).Status);
        Assert.Equal(HttpStatusCode.OK, (await anonymous.Post("GetPage", new { slug = "my-setup" })).Status);
        Assert.Equal(2, (await anonymous.Post("GetPages")).Data.GetArrayLength());
    }
}
