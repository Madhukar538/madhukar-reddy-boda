using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>The Editorial homepage story: read by anyone, saved only by the site's admin, checked and kept per site.</summary>
public class StoryTests
{
    private const string Story = """{"hero":{"heading":"Asha","meta":["A story"],"nameLines":["Asha"],"index":[],"badge":"BUILDS ✶","lede":"Builds **things**.","body":"Hello."},"ticker":[{"label":"Go","icon":"go"}],"story":{"kicker":"So far","headline":"One *thread*.","chapters":[]}}""";

    [Fact]
    public async Task The_story_is_saved_by_the_admin_and_read_by_anyone()
    {
        using ApiFactory factory = new();
        HttpClient anonymous = factory.CreateApiClient();
        // Until one is saved the site shows its built-in story: the API answers with an empty one.
        ApiResult empty = await anonymous.Post("GetStory");
        Assert.Equal(HttpStatusCode.OK, empty.Status);
        Assert.Equal(string.Empty, empty.Data.GetProperty("json").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("SaveStory", new { json = Story })).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SaveStory", new { json = Story }, token: session.AccessToken)).Status);
        Assert.Equal(Story, (await anonymous.Post("GetStory")).Data.GetProperty("json").GetString());
        // The homepage is refreshed with the story tag.
        Assert.Contains(factory.Site.Requests, r => r.Body.Contains("\"story\"", StringComparison.Ordinal));

        // Saving nothing goes back to the built-in story.
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SaveStory", new { json = string.Empty }, token: session.AccessToken)).Status);
        Assert.Equal(string.Empty, (await anonymous.Post("GetStory")).Data.GetProperty("json").GetString());
    }

    [Fact]
    public async Task Broken_or_oversized_stories_are_refused()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        string huge = JsonSerializer.Serialize(new { hero = new { body = new string('x', 70_000) }, ticker = Array.Empty<object>(), story = new { chapters = Array.Empty<object>() } });
        foreach (string bad in new[] { "{not json", "[]", "\"text\"", """{"hero":{},"ticker":[]}""", """{"hero":[],"ticker":[],"story":{"chapters":[]}}""", huge })
        {
            Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("SaveStory", new { json = bad }, token: session.AccessToken)).Status);
        }
        Assert.Equal(string.Empty, (await session.Client.Post("GetStory")).Data.GetProperty("json").GetString());
    }

    [Fact]
    public async Task Each_site_has_its_own_story()
    {
        using ApiFactory factory = new();
        string slug = "site-" + Guid.NewGuid().ToString("N")[..10];
        using (IServiceScope scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<TenantBAL>().Provision(new ProvisionTenantRequestDTO { Slug = slug, Name = "Asha" });
        }
        AdminSession site = await AdminSession.SignedIn(factory, slug);
        Assert.Equal(HttpStatusCode.OK, (await site.Client.Post("SaveStory", new { json = Story }, token: site.AccessToken)).Status);

        HttpClient anonymous = factory.CreateApiClient();
        Assert.Equal(Story, (await anonymous.Post("GetStory", headers: new() { ["X-Tenant"] = slug })).Data.GetProperty("json").GetString());
        Assert.Equal(string.Empty, (await anonymous.Post("GetStory")).Data.GetProperty("json").GetString());
    }
}
