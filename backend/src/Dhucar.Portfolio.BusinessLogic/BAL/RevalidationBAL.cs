using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  26 Sep 2026
 * Modified Reason :  Logs the site's status when a refresh is refused, so failures are visible.
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Tells the Next.js site which cache tags changed, with an HMAC-SHA256 signature over timestamp and body.
 */
public class RevalidationBAL(IHttpClientFactory httpClientFactory, IOptions<PortfolioSettings> options, ICodeLogger codeLog, ILogger<RevalidationBAL> logger)
{
    /// <summary>Named HttpClient used for revalidation calls.</summary>
    public const string HttpClientName = "revalidation";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Revalidate
    // Method Description    :   Posts the changed tags to the site; returns false (never throws) if it is unreachable, so saves still succeed.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   tags
    // Modified Date         :   26 Sep 2026
    // Modified Reason       :   Logs the site's status when a refresh is refused, so failures are visible.
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    26 Sep 2026       Log refused refreshes
    //****************************************************************************************************
    /// <summary>
    /// <c>Revalidate : </c> Posts the changed tags to the site; returns false (never throws) if it is unreachable, so saves still succeed.
    /// </summary>
    public async Task<bool> Revalidate(IEnumerable<string> tags)
    {
        SiteSettings site = options.Value.Site;
        if (site.RevalidateUrl.Length == 0 || site.RevalidateSecret.Length < 32)
        {
            return false;
        }
        try
        {
            string body = JsonSerializer.Serialize(new { tags = tags.Distinct().ToArray() });
            string timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, site.RevalidateUrl)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            };
            request.Headers.Add("X-Timestamp", timestamp);
            request.Headers.Add("X-Signature", RequestSigner.Sign(site.RevalidateSecret, timestamp, body));
            using HttpResponseMessage response = await httpClientFactory.CreateClient(HttpClientName).SendAsync(request);
            codeLog.Code("Revalidate", $"Site answered {(int)response.StatusCode}");
            if (!response.IsSuccessStatusCode)
            {
                // 404: the site has no REVALIDATE_SECRET. 401: the secrets differ or the clocks disagree.
                // 403 or HTML: something in front of the site (such as a firewall) refused the call.
                string answer = await response.Content.ReadAsStringAsync();
                logger.LogWarning("Site refresh refused by {Url}: {Status} {Answer}", site.RevalidateUrl, (int)response.StatusCode, answer.Length > 200 ? answer[..200] : answer);
            }
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            codeLog.Error(ex, "Step Revalidate", string.Empty, nameof(Revalidate));
            return false;
        }
    }
}
