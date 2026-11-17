using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>Per-site browser access, passkeys, sessions and images.</summary>
public class SiteSettingsTests
{
    private static readonly byte[] Png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    private static async Task<(string Slug, string Host, string SetupToken)> NewSite(ApiFactory factory, bool withHost = true)
    {
        string slug = "site-" + Guid.NewGuid().ToString("N")[..10];
        string host = slug + ".example.com";
        using IServiceScope scope = factory.Services.CreateScope();
        Properties.Response<object> created = await scope.ServiceProvider.GetRequiredService<TenantBAL>().Provision(new ProvisionTenantRequestDTO { Slug = slug, Name = "Asha", Hosts = withHost ? [host] : [] });
        Assert.Equal(1, created.ReturnCode);
        return (slug, host, ((ProvisionResultDTO)created.Data!).SetupToken);
    }

    private static async Task<HttpResponseMessage> Preflight(HttpClient client, string origin)
    {
        using HttpRequestMessage request = new(HttpMethod.Options, "/api/GetPosts");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type,x-tenant");
        return await client.SendAsync(request);
    }

    private static string? AllowedOrigin(HttpResponseMessage response) =>
        response.Headers.TryGetValues("Access-Control-Allow-Origin", out IEnumerable<string>? values) ? values.Single() : null;

    [Fact]
    public async Task Browsers_are_let_in_from_each_sites_own_origin_only()
    {
        using ApiFactory factory = new();
        (string slug, string host, _) = await NewSite(factory);
        HttpClient client = factory.CreateApiClient();

        Assert.Equal(ApiFactory.Origin, AllowedOrigin(await Preflight(client, ApiFactory.Origin)));
        Assert.Equal("https://" + host, AllowedOrigin(await Preflight(client, "https://" + host)));
        foreach (string refused in new[] { "https://evil.example.com", "http://" + host, $"https://{host}:8443", "null" })
        {
            Assert.Null(AllowedOrigin(await Preflight(client, refused)));
        }

        // A page on one site can't ask for another site's data.
        Assert.Equal(HttpStatusCode.NotFound, (await client.Post("GetPosts", headers: new() { ["Origin"] = "https://" + host, ["X-Tenant"] = "main" })).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await client.Post("GetPosts", headers: new() { ["Origin"] = ApiFactory.Origin, ["X-Tenant"] = slug })).Status);
        Assert.Equal(HttpStatusCode.OK, (await client.Post("GetPosts", headers: new() { ["Origin"] = "https://" + host, ["X-Tenant"] = slug })).Status);
    }

    [Fact]
    public async Task Each_site_has_its_own_admin_session_passkeys_and_images()
    {
        using ApiFactory factory = new();
        (string slug, string host, string setupToken) = await NewSite(factory);
        AdminSession site = await AdminSession.SignedIn(factory, slug, setupToken);

        // Its own refresh cookie, so a browser signed in to two sites keeps both sessions.
        ApiResult refreshed = await site.Client.Post("RefreshToken", headers: new() { ["X-Requested-With"] = "dhucar-admin" });
        Assert.Equal(HttpStatusCode.OK, refreshed.Status);
        Assert.Contains(refreshed.Response.Headers.GetValues("Set-Cookie"), x => x.StartsWith($"__Host-rt_{slug}=", StringComparison.Ordinal));

        // The site's admin token is refused by the primary site.
        HttpClient primary = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await primary.Post("GetTickets", new { }, token: site.AccessToken)).Status);

        // Passkeys are registered against the site's own domain.
        ApiResult options = await site.Client.Post("PasskeyRegisterOptions", token: site.AccessToken);
        Assert.Equal(HttpStatusCode.OK, options.Status);
        Assert.Equal(host, options.Data.GetProperty("options").GetProperty("rp").GetProperty("id").GetString());
        SoftwareAuthenticator authenticator = new(host, "https://" + host);
        ApiResult register = await site.Client.Post("PasskeyRegister", new
        {
            challengeId = options.Data.GetProperty("challengeId").GetString(),
            name = "Site key",
            credential = authenticator.Create(options.Data.GetProperty("options")),
        }, token: site.AccessToken);
        Assert.Equal(HttpStatusCode.OK, register.Status);

        // Images name their site in the URL, and are only found through it.
        using MultipartFormDataContent form = new();
        ByteArrayContent file = new(Png);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(file, "file", "dot.png");
        form.Add(new StringContent("1"), "width");
        form.Add(new StringContent("1"), "height");
        using HttpRequestMessage upload = new(HttpMethod.Post, "/api/UploadImage") { Content = form };
        upload.Headers.Authorization = new AuthenticationHeaderValue("Bearer", site.AccessToken);
        HttpResponseMessage uploaded = await site.Client.SendAsync(upload);
        Assert.Equal(HttpStatusCode.OK, uploaded.StatusCode);
        string url = JsonDocument.Parse(await uploaded.Content.ReadAsStringAsync()).RootElement.GetProperty("data").GetProperty("url").GetString()!;
        Assert.EndsWith($"?site={slug}", url);
        HttpClient browser = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync(url)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await browser.GetAsync(url[..url.IndexOf('?')])).StatusCode);
    }

    [Fact]
    public async Task A_site_without_a_domain_has_no_passkeys_yet()
    {
        using ApiFactory factory = new();
        (string slug, _, string setupToken) = await NewSite(factory, withHost: false);
        AdminSession site = await AdminSession.SignedIn(factory, slug, setupToken);
        Assert.NotEqual(HttpStatusCode.OK, (await site.Client.Post("PasskeyRegisterOptions", token: site.AccessToken)).Status);
    }
}
