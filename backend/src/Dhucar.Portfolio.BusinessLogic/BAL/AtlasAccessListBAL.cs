using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json.Serialization;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Keeps this server's public IP on the MongoDB Atlas project's access list, through the Atlas
 *                    Administration API. Reads the list from Atlas each time (no local state, so it works while the
 *                    database itself is unreachable), adds the current IP, and removes only the entries it added before.
 */
public class AtlasAccessListBAL(IHttpClientFactory httpClientFactory, IOptions<PortfolioSettings> options, ILogger<AtlasAccessListBAL> logger)
{
    /// <summary>Named client for the Atlas API (digest authentication with the API key).</summary>
    public const string HttpClientName = "atlas";

    /// <summary>Named client for the public-IP lookup.</summary>
    public const string IpEchoClientName = "ip-echo";

    /// <summary>Atlas Administration API version.</summary>
    public const string ApiMediaType = "application/vnd.atlas.2023-01-01+json";

    private sealed record AccessListPage([property: JsonPropertyName("results")] List<AccessListEntry>? Results);

    private sealed record AccessListEntry(
        [property: JsonPropertyName("ipAddress")] string? IpAddress,
        [property: JsonPropertyName("cidrBlock")] string? CidrBlock,
        [property: JsonPropertyName("comment")] string? Comment);

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SyncOnce
    // Method Description    :   Puts the current public IP on the access list and drops this service's stale entries.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   cancellationToken
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   What changed, for the log ("unchanged", "added 1.2.3.4; removed 5.6.7.8")
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SyncOnce : </c> Puts the current public IP on the access list and drops this service's stale entries.
    /// </summary>
    public async Task<string> SyncOnce(CancellationToken cancellationToken)
    {
        return await SyncOnce(await PublicIp(cancellationToken), cancellationToken);
    }

    /// <summary>
    /// <c>SyncOnce : </c> As above, for an IP already looked up (the background service checks the IP on its own,
    /// often, and only calls Atlas when it changed).
    /// </summary>
    public async Task<string> SyncOnce(string ip, CancellationToken cancellationToken)
    {
        AtlasSettings atlas = options.Value.Atlas;
        HttpClient client = httpClientFactory.CreateClient(HttpClientName);
        string listUrl = $"{atlas.BaseUrl.TrimEnd('/')}/api/atlas/v2/groups/{Uri.EscapeDataString(atlas.ProjectId.Trim())}/accessList";

        using HttpRequestMessage get = new(HttpMethod.Get, $"{listUrl}?itemsPerPage=500");
        get.Headers.Accept.ParseAdd(ApiMediaType);
        using HttpResponseMessage listResponse = await client.SendAsync(get, cancellationToken);
        listResponse.EnsureSuccessStatusCode();
        List<AccessListEntry> entries = (await listResponse.Content.ReadFromJsonAsync<AccessListPage>(cancellationToken))?.Results ?? [];

        List<string> changes = new List<string>();
        bool isListed = entries.Any(e => e.IpAddress == ip || e.CidrBlock == $"{ip}/32");
        if (!isListed)
        {
            using HttpRequestMessage post = new(HttpMethod.Post, listUrl)
            {
                Content = JsonContent.Create(new[] { new { ipAddress = ip, comment = atlas.Comment } }),
            };
            post.Headers.Accept.ParseAdd(ApiMediaType);
            using HttpResponseMessage added = await client.SendAsync(post, cancellationToken);
            added.EnsureSuccessStatusCode();
            changes.Add($"added {ip}");
        }

        // Only this service's own entries (by comment) that are no longer this server's IP.
        foreach (AccessListEntry stale in entries.Where(e => e.Comment == atlas.Comment && e.IpAddress is { Length: > 0 } && e.IpAddress != ip))
        {
            using HttpRequestMessage delete = new(HttpMethod.Delete, $"{listUrl}/{Uri.EscapeDataString(stale.IpAddress!)}");
            delete.Headers.Accept.ParseAdd(ApiMediaType);
            using HttpResponseMessage removed = await client.SendAsync(delete, cancellationToken);
            if (removed.IsSuccessStatusCode || removed.StatusCode == HttpStatusCode.NotFound)
            {
                changes.Add($"removed {stale.IpAddress}");
            }
            else
            {
                logger.LogWarning("Atlas access list: could not remove {Ip} ({Status})", stale.IpAddress, (int)removed.StatusCode);
            }
        }
        return changes.Count == 0 ? "unchanged" : string.Join("; ", changes);
    }

    /// <summary>This server's public IPv4 address, as the IP echo service sees it.</summary>
    public async Task<string> PublicIp(CancellationToken cancellationToken)
    {
        string text = (await httpClientFactory.CreateClient(IpEchoClientName).GetStringAsync(options.Value.Atlas.IpEchoUrl, cancellationToken)).Trim();
        if (!IPAddress.TryParse(text, out IPAddress? address) || address.AddressFamily != AddressFamily.InterNetwork)
        {
            throw new InvalidOperationException("The IP echo service did not return an IPv4 address.");
        }
        return address.ToString();
    }
}
