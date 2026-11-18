using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>Browser errors: reported by anyone, grouped and counted, cleaned of anything personal, seen and cleared only by the admin.</summary>
public class ClientErrorTests
{
    private const string Browser = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
    private static readonly Dictionary<string, string> AsBrowser = new() { ["User-Agent"] = Browser };

    private static Task<ApiResult> Report(HttpClient client, object body, Dictionary<string, string>? headers = null) =>
        client.Post("ReportClientError", body, headers: headers ?? AsBrowser);

    [Fact]
    public async Task Errors_are_grouped_counted_and_cleaned_before_the_admin_sees_them()
    {
        using ApiFactory factory = new();
        HttpClient anonymous = factory.CreateApiClient();
        object error = new
        {
            message = "TypeError: x is undefined for jane@example.com order 12345678 at https://dhucar.in/blog?token=secret",
            source = "https://dhucar.in/_next/static/chunks/app.js?v=2",
            line = 10,
            column = 4,
            stack = "TypeError: x is undefined\n    at run (https://dhucar.in/_next/static/chunks/app.js?v=2:10:4)",
            page = "/blog/some-post?ref=mail#top",
            look = "gazette",
        };
        Assert.Equal(HttpStatusCode.OK, (await Report(anonymous, error)).Status);
        Assert.Equal(HttpStatusCode.OK, (await Report(anonymous, error)).Status);
        Assert.Equal(HttpStatusCode.OK, (await Report(anonymous, new { message = "Another", page = "/", look = "not-a-look" })).Status);

        // Skipped, but accepted all the same: bots, extensions and the no-detail cross-origin message.
        Assert.Equal(HttpStatusCode.OK, (await Report(anonymous, new { message = "Bot", page = "/" }, new() { ["User-Agent"] = "Googlebot/2.1" })).Status);
        Assert.Equal(HttpStatusCode.OK, (await Report(anonymous, new { message = "Ext", page = "/", source = "chrome-extension://abc/inject.js" })).Status);
        Assert.Equal(HttpStatusCode.OK, (await Report(anonymous, new { message = "Script error.", page = "/" })).Status);
        // A report needs a message and a site page.
        Assert.Equal(HttpStatusCode.BadRequest, (await Report(anonymous, new { message = "", page = "/" })).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Report(anonymous, new { message = "x", page = "https://evil.example/" })).Status);

        // Only the admin can read or clear them.
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("GetClientErrors")).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("ClearClientErrors", new { id = "" })).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult list = await session.Client.Post("GetClientErrors", token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, list.Status);
        List<JsonElement> groups = list.Data.EnumerateArray().ToList();
        Assert.Equal(2, groups.Count);
        JsonElement grouped = groups.Single(g => g.GetProperty("count").GetInt64() == 2);
        string message = grouped.GetProperty("message").GetString()!;
        Assert.DoesNotContain("jane@example.com", message);
        Assert.DoesNotContain("12345678", message);
        Assert.DoesNotContain("secret", message);
        Assert.Contains("[email]", message);
        Assert.Equal("/_next/static/chunks/app.js", grouped.GetProperty("source").GetString());
        Assert.DoesNotContain("v=2", grouped.GetProperty("stack").GetString());
        Assert.Contains("/_next/static/chunks/app.js:10:4", grouped.GetProperty("stack").GetString());
        Assert.Equal("/blog/some-post", grouped.GetProperty("page").GetString());
        Assert.Equal("gazette", grouped.GetProperty("look").GetString());
        Assert.Equal("Chrome", grouped.GetProperty("browser").GetString());
        Assert.Equal(string.Empty, groups.Single(g => g.GetProperty("message").GetString() == "Another").GetProperty("look").GetString());

        // Clear one, then the rest.
        string id = grouped.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("ClearClientErrors", new { id }, token: session.AccessToken)).Status);
        Assert.Single((await session.Client.Post("GetClientErrors", token: session.AccessToken)).Data.EnumerateArray());
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("ClearClientErrors", new { id = "" }, token: session.AccessToken)).Status);
        Assert.Empty((await session.Client.Post("GetClientErrors", token: session.AccessToken)).Data.EnumerateArray());
    }
}
