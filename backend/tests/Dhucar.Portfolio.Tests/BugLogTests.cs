using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>The public bug log: read by anyone, saved whole only by the site's admin, each entry checked.</summary>
public class BugLogTests
{
    private static object Entry(string title = "Checkout API timing out at 300 rps") => new
    {
        title,
        when = "Oct 2026",
        stack = ".NET 8 · SQL Server",
        symptom = "Checkout timed out under load.",
        cause = "A missing index made each order scan the table.",
        fix = "Added the index and a covering include.",
        result = "p95 from 4 s to 180 ms",
    };

    [Fact]
    public async Task The_log_is_saved_by_the_admin_and_read_by_anyone()
    {
        using ApiFactory factory = new();
        HttpClient anonymous = factory.CreateApiClient();
        ApiResult empty = await anonymous.Post("GetBugLog");
        Assert.Equal(HttpStatusCode.OK, empty.Status);
        Assert.Equal(0, empty.Data.GetProperty("entries").GetArrayLength());
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("SaveBugLog", new { entries = new[] { Entry() } })).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SaveBugLog", new { entries = new[] { Entry(), Entry("Second bug") } }, token: session.AccessToken)).Status);
        ApiResult saved = await anonymous.Post("GetBugLog");
        Assert.Equal(2, saved.Data.GetProperty("entries").GetArrayLength());
        Assert.Equal("Checkout API timing out at 300 rps", saved.Data.GetProperty("entries")[0].GetProperty("title").GetString());
        Assert.Equal("p95 from 4 s to 180 ms", saved.Data.GetProperty("entries")[0].GetProperty("result").GetString());
        // The pages that show it are refreshed with the bugLog tag.
        Assert.Contains(factory.Site.Requests, r => r.Body.Contains("\"bugLog\"", StringComparison.Ordinal));

        // An empty list clears it.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SaveBugLog", new { entries = Array.Empty<object>() }, token: session.AccessToken)).Status);
        Assert.Equal(0, (await anonymous.Post("GetBugLog")).Data.GetProperty("entries").GetArrayLength());
    }

    [Fact]
    public async Task Entries_missing_a_field_or_too_long_are_refused()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        object noFix = new { title = "A bug", when = "Oct 2026", symptom = "It broke.", cause = "Because.", fix = "  " };
        ApiResult missing = await session.Client.Post("SaveBugLog", new { entries = new[] { Entry(), noFix } }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.BadRequest, missing.Status);
        Assert.Contains("Entry 2 needs a fix", missing.Body.GetProperty("returnMessage").GetString());

        ApiResult longTitle = await session.Client.Post("SaveBugLog", new { entries = new[] { Entry(new string('x', 121)) } }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.BadRequest, longTitle.Status);

        // Nothing was saved by the refused attempts.
        Assert.Equal(0, (await factory.CreateApiClient().Post("GetBugLog")).Data.GetProperty("entries").GetArrayLength());
    }
}
