using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class ContentTests
{
    private static object Post(string slug, string content, bool isPublished = true) => new
    {
        slug,
        title = "Test post",
        excerpt = "An excerpt.",
        content,
        date = "September 26, 2026",
        category = "Testing",
        tags = new[] { "Security" },
        isPublished,
    };

    [Fact]
    public async Task Site_content_is_seeded_and_public_reads_work()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        ApiResult posts = await client.Post("GetPosts");
        Assert.Equal(11, posts.Data.GetArrayLength());
        ApiResult post = await client.Post("GetPost", new { slug = "mcp-server-code-database-intelligence" });
        Assert.Equal(HttpStatusCode.OK, post.Status);
        Assert.Equal(HttpStatusCode.NotFound, (await client.Post("GetPost", new { slug = "does-not-exist" })).Status);
        ApiResult lab = await client.Post("GetProjects", new { kind = "lab" });
        Assert.Equal(19, lab.Data.GetArrayLength());
        ApiResult profile = await client.Post("GetProfile");
        Assert.Equal("Boda Madhukar Reddy", profile.Data.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Writes_require_a_session()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("SavePost", Post("hack", "<p>x</p>"))).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("DeletePost", new { id = "mcp-server-code-database-intelligence" })).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("SaveProfile", new { profile = new { name = "x" } })).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("GetTrafficSummary", new { days = 7 })).Status);
    }

    [Fact]
    public async Task Saved_HTML_is_sanitised()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        string dirty = "<p class=\"lead\" onclick=\"steal()\">Hi <a href=\"javascript:alert(1)\">x</a></p><script>alert(1)</script>" +
                       "<img src=x onerror=alert(1)><pre class=\"language-csharp\">var a = 1;</pre><iframe src=\"https://evil\"></iframe><p style=\"color:red\">s</p>";
        ApiResult saved = await session.Client.Post("SavePost", Post("xss-test", dirty), token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, saved.Status);
        string html = (await session.Client.Post("GetPost", new { slug = "xss-test" })).Data.GetProperty("content").GetString()!;
        Assert.DoesNotContain("<script", html);
        Assert.DoesNotContain("onclick", html);
        Assert.DoesNotContain("onerror", html);
        Assert.DoesNotContain("javascript:", html);
        Assert.DoesNotContain("<iframe", html);
        Assert.DoesNotContain("style=", html);
        Assert.Contains("class=\"lead\"", html);
        Assert.Contains("<pre class=\"language-csharp\">", html);
    }

    [Fact]
    public async Task Saving_tells_the_site_with_a_valid_signature()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult saved = await session.Client.Post("SavePost", Post("webhook-test", "<p>Hello</p>"), token: session.AccessToken);
        Assert.True(saved.Data.GetProperty("isRevalidated").GetBoolean());
        (Uri url, Dictionary<string, string> headers, string body) = Assert.Single(factory.Site.Requests);
        Assert.Equal("https://site.test/api/revalidate", url.ToString());
        Assert.Equal(RequestSigner.Sign(ApiFactory.RevalidateSecret, headers["X-Timestamp"], body), headers["X-Signature"]);
        string[] tags = JsonDocument.Parse(body).RootElement.GetProperty("tags").EnumerateArray().Select(x => x.GetString()!).ToArray();
        Assert.Equal(["posts", "post:webhook-test"], tags);
    }

    [Fact]
    public async Task Drafts_stay_private_and_invalid_input_is_rejected()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePost", Post("draft-post", "<p>WIP</p>", isPublished: false), token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await session.Client.Post("GetPost", new { slug = "draft-post" })).Status);
        Assert.Equal(11, (await session.Client.Post("GetPosts")).Data.GetArrayLength());
        Assert.Equal(12, (await session.Client.Post("GetAllPosts", token: session.AccessToken)).Data.GetArrayLength());

        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SavePost", Post("Bad Slug!", "<p>x</p>"), token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SaveProject", new { kind = "client", title = "X", url = "http://insecure.example" }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SaveProject", new { kind = "lab", title = "X", status = "DONE" }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("DeletePost", new { id = "draft-post" }, token: session.AccessToken)).Status);
    }

    [Fact]
    public async Task Public_reads_do_not_expose_the_editor()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        await session.Client.Post("SavePost", Post("editor-test", "<p>x</p>"), token: session.AccessToken);
        Assert.Equal(string.Empty, (await session.Client.Post("GetPost", new { slug = "editor-test" })).Data.GetProperty("updatedBy").GetString());
        Assert.DoesNotContain(AdminSession.Email, (await session.Client.Post("GetPosts")).Body.ToString());
        Assert.Contains(AdminSession.Email, (await session.Client.Post("GetAllPosts", token: session.AccessToken)).Body.ToString());
    }

    [Fact]
    public void Sanitising_the_existing_posts_keeps_all_their_text()
    {
        static string Text(string html) => System.Net.WebUtility.HtmlDecode(System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " "))
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Aggregate(string.Empty, (a, b) => a + " " + b);
        using JsonDocument seed = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "seed", "content.json")));
        foreach (JsonElement post in seed.RootElement.GetProperty("posts").EnumerateArray())
        {
            string html = post.GetProperty("content").GetString()!;
            Assert.Equal(Text(html), Text(Dhucar.Portfolio.BusinessLogic.BAL.PostBAL.SanitizeHtml(html)));
        }
    }
}
