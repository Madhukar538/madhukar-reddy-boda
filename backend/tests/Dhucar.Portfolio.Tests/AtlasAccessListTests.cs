using System.Net;
using System.Text;
using System.Text.Json;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>AtlasAccessListBAL against a fake Atlas API and IP echo (no host, no network).</summary>
public class AtlasAccessListTests
{
    private const string Comment = "portfolio-api (auto)";

    private sealed class FakeAtlas : HttpMessageHandler
    {
        public string PublicIp { get; set; } = "203.0.113.7";

        public List<(string Ip, string? Comment)> Entries { get; } = new();

        public List<string> Calls { get; } = new();

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string path = request.RequestUri!.AbsolutePath;
            Calls.Add($"{request.Method} {path}");
            if (request.RequestUri.Host == "ip.test")
            {
                return Text(PublicIp);
            }
            Assert.Equal(AtlasAccessListBAL.ApiMediaType, request.Headers.Accept.Single().MediaType);
            if (request.Method == HttpMethod.Get)
            {
                var results = Entries.Select(e => new { ipAddress = e.Ip, cidrBlock = $"{e.Ip}/32", comment = e.Comment });
                return Text(JsonSerializer.Serialize(new { results }));
            }
            if (request.Method == HttpMethod.Post)
            {
                JsonElement body = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(cancellationToken)).RootElement[0];
                Entries.Add((body.GetProperty("ipAddress").GetString()!, body.GetProperty("comment").GetString()));
                return Text("{}");
            }
            string ip = Uri.UnescapeDataString(path[(path.LastIndexOf('/') + 1)..]);
            Entries.RemoveAll(e => e.Ip == ip);
            return new HttpResponseMessage(HttpStatusCode.NoContent);
        }

        private static HttpResponseMessage Text(string body) => new(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
    }

    private sealed class Factory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private static AtlasAccessListBAL Sync(FakeAtlas atlas) => new(
        new Factory(atlas),
        Options.Create(new PortfolioSettings
        {
            Atlas = new AtlasSettings
            {
                PublicKey = "pub",
                PrivateKey = "priv",
                ProjectId = "proj1",
                Comment = Comment,
                IpEchoUrl = "https://ip.test/",
                BaseUrl = "https://atlas.test",
            },
        }),
        NullLogger<AtlasAccessListBAL>.Instance);

    [Fact]
    public async Task A_new_ip_is_added_and_only_our_old_entry_is_removed()
    {
        FakeAtlas atlas = new();
        atlas.Entries.Add(("198.51.100.1", Comment));       // ours, from before the IP changed
        atlas.Entries.Add(("192.0.2.50", "laptop"));        // someone else's: never touched

        string result = await Sync(atlas).SyncOnce(CancellationToken.None);

        Assert.Equal("added 203.0.113.7; removed 198.51.100.1", result);
        Assert.Equal([("192.0.2.50", "laptop"), ("203.0.113.7", Comment)], atlas.Entries.OrderBy(e => e.Ip).ToList());
        Assert.Contains("POST /api/atlas/v2/groups/proj1/accessList", atlas.Calls);
    }

    [Fact]
    public async Task Nothing_changes_when_the_ip_is_already_listed()
    {
        FakeAtlas atlas = new();
        atlas.Entries.Add(("203.0.113.7", "added by hand"));

        Assert.Equal("unchanged", await Sync(atlas).SyncOnce(CancellationToken.None));
        Assert.DoesNotContain(atlas.Calls, c => c.StartsWith("POST") || c.StartsWith("DELETE"));
    }

    [Fact]
    public async Task A_non_ipv4_answer_from_the_echo_service_is_refused()
    {
        FakeAtlas atlas = new() { PublicIp = "<html>error</html>" };
        await Assert.ThrowsAsync<InvalidOperationException>(() => Sync(atlas).SyncOnce(CancellationToken.None));
        Assert.DoesNotContain(atlas.Calls, c => c.Contains("accessList"));
    }
}
