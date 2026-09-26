using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class SecurityBasicsTests
{
    [Fact]
    public async Task Responses_carry_security_headers_and_no_server_banner()
    {
        using ApiFactory factory = new();
        HttpResponseMessage response = await factory.CreateApiClient().GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Contains("default-src 'none'", response.Headers.GetValues("Content-Security-Policy").Single());
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.False(response.Headers.Contains("Server"));
        Assert.True(response.Headers.Contains("Strict-Transport-Security"));
    }

    [Fact]
    public async Task CORS_allows_only_the_site_origin()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        async Task<HttpResponseMessage> Preflight(string origin)
        {
            using HttpRequestMessage request = new(HttpMethod.Options, "/api/Login");
            request.Headers.Add("Origin", origin);
            request.Headers.Add("Access-Control-Request-Method", "POST");
            request.Headers.Add("Access-Control-Request-Headers", "content-type");
            return await client.SendAsync(request);
        }
        HttpResponseMessage allowed = await Preflight(ApiFactory.Origin);
        Assert.Equal(ApiFactory.Origin, allowed.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Equal("true", allowed.Headers.GetValues("Access-Control-Allow-Credentials").Single());
        HttpResponseMessage denied = await Preflight("https://evil.example");
        Assert.False(denied.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Malformed_json_gets_the_standard_envelope()
    {
        using ApiFactory factory = new();
        ApiResult result = await factory.CreateApiClient().Post("Login", "{not json");
        Assert.Equal(HttpStatusCode.BadRequest, result.Status);
        Assert.Equal(-1, result.ReturnCode);
    }

    [Fact]
    public async Task Sign_in_endpoints_are_rate_limited_per_client()
    {
        using ApiFactory factory = new(new() { ["Portfolio:Security:AuthRequestsPerMinute"] = "3" });
        HttpClient client = factory.CreateApiClient();
        List<HttpStatusCode> statuses = new();
        for (int attempt = 0; attempt < 5; attempt++)
        {
            statuses.Add((await client.Post("Login", new { email = "a@b.co", password = "whatever-password" })).Status);
        }
        Assert.Equal(3, statuses.Count(x => x == HttpStatusCode.Unauthorized));
        Assert.Equal(2, statuses.Count(x => x == HttpStatusCode.TooManyRequests));
    }

    [Fact]
    public async Task Session_refresh_is_not_held_to_the_sign_in_limit()
    {
        // The admin renews its session on every page load; a few reloads must not lock it out.
        using ApiFactory factory = new(new() { ["Portfolio:Security:AuthRequestsPerMinute"] = "3" });
        HttpClient client = factory.CreateApiClient();
        Dictionary<string, string> csrf = new() { ["X-Requested-With"] = "dhucar-admin" };
        List<HttpStatusCode> statuses = new();
        for (int attempt = 0; attempt < 6; attempt++)
        {
            statuses.Add((await client.Post("RefreshToken", headers: csrf)).Status);
        }
        Assert.All(statuses, status => Assert.Equal(HttpStatusCode.Unauthorized, status));
    }

    [Fact]
    public void Startup_refuses_weak_configuration()
    {
        using ApiFactory factory = new(new() { ["Portfolio:Security:JwtSigningKey"] = Convert.ToBase64String(new byte[8]) });
        Exception error = Assert.ThrowsAny<Exception>(() => factory.CreateApiClient());
        Assert.Contains("JwtSigningKey", error.ToString());
    }
}
