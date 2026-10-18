using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Traffic reports run in parallel
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Cookieless, privacy-first page-view tracking and the traffic dashboard summary.
 */
public partial class TrafficBAL(PageViewDAL pageViewDAL, SaltDAL saltDAL, EngagementBAL engagementBAL, IContextService contextService, IOptions<PortfolioSettings> options, ICodeLogger codeLog)
{
    [GeneratedRegex(@"bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|httpclient|go-http|java/|scrapy|uptime", RegexOptions.IgnoreCase)]
    private static partial Regex BotPattern();

    [GeneratedRegex("^[a-z0-9_.-]{1,64}$")]
    private static partial Regex UtmPattern();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   TrackPageView
    // Method Description    :   Records one anonymous view: no IP, cookie or id stored; honours Do Not Track and Global Privacy Control; skips bots, admin and API paths.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>TrackPageView : </c> Records one anonymous view: no IP, cookie or id stored; honours Do Not Track and Global Privacy Control; skips bots, admin and API paths.
    /// </summary>
    public async Task<Response<object>> TrackPageView(TrackPageViewRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            // Accepted either way, so the browser gets no signal about what was stored.
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "OK.";
            string userAgent = contextService.GetUserAgent();
            if (contextService.GetHeader("DNT") == "1" || contextService.GetHeader("Sec-GPC") == "1" || userAgent.Length == 0 || BotPattern().IsMatch(userAgent))
            {
                return objResponse;
            }
            string path = NormalizePath(objAPIRequest.Path);
            if (path.Length == 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Invalid path.";
                return objResponse;
            }
            DateTime now = DateTime.UtcNow;
            string day = now.ToString("yyyy-MM-dd");
            string salt = await saltDAL.GetOrCreateSaltDB(day);
            string utm = (objAPIRequest.UtmSource ?? string.Empty).Trim().ToLowerInvariant();
            await pageViewDAL.InsertPageViewDB(new PageViewDocument
            {
                Timestamp = now,
                Day = day,
                Path = path,
                ReferrerHost = ReferrerHost(objAPIRequest.Referrer),
                UtmSource = UtmPattern().IsMatch(utm) ? utm : string.Empty,
                Device = DeviceClass(userAgent),
                Country = contextService.GetCountry(),
                VisitorHash = VisitorHash(salt, contextService.GetClientIp(), userAgent),
            });
            // A blog post's lasting read count (raw page views expire).
            await engagementBAL.RecordRead(path);
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step TrackPageView", string.Empty, nameof(TrackPageView));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetTrafficSummary
    // Method Description    :   Totals, daily series and top pages, referrers, devices and countries for the last N days.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :   18 Oct 2026
    // Modified Reason       :   Runs the five reports at the same time
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    18 Oct 2026       Reports run in parallel
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTrafficSummary : </c> Totals, daily series and top pages, referrers, devices and countries for the last N days.
    /// </summary>
    public async Task<Response<object>> GetTrafficSummary(GetTrafficSummaryRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            int days = objAPIRequest.Days is >= 1 and <= 365 ? objAPIRequest.Days : 30;
            string fromDay = DateTime.UtcNow.Date.AddDays(1 - days).ToString("yyyy-MM-dd");
            // The five reports are independent: ask for them together, one round trip of waiting instead of five.
            Task<List<DailyTrafficDTO>> dailyTask = pageViewDAL.GetDailyTrafficDB(fromDay);
            Task<List<CountItemDTO>> pagesTask = pageViewDAL.GetTopValuesDB(fromDay, "Path", 20);
            Task<List<CountItemDTO>> referrersTask = pageViewDAL.GetTopValuesDB(fromDay, "ReferrerHost", 10);
            Task<List<CountItemDTO>> devicesTask = pageViewDAL.GetTopValuesDB(fromDay, "Device", 5);
            Task<List<CountItemDTO>> countriesTask = pageViewDAL.GetTopValuesDB(fromDay, "Country", 10);
            await Task.WhenAll(dailyTask, pagesTask, referrersTask, devicesTask, countriesTask);
            List<DailyTrafficDTO> daily = dailyTask.Result;
            objResponse.Data = new TrafficSummaryDTO
            {
                Days = days,
                PageViews = daily.Sum(x => x.PageViews),
                Visitors = daily.Sum(x => x.Visitors),
                Daily = daily,
                TopPages = pagesTask.Result,
                TopReferrers = referrersTask.Result,
                Devices = devicesTask.Result,
                Countries = countriesTask.Result,
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetTrafficSummary", string.Empty, nameof(GetTrafficSummary));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   NormalizePath
    // Method Description    :   Keeps a site path without query or fragment; rejects admin, API and malformed paths.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   path
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>NormalizePath : </c> Keeps a site path without query or fragment; rejects admin, API and malformed paths.
    /// </summary>
    public static string NormalizePath(string? path)
    {
        string value = (path ?? string.Empty).Trim();
        int cut = value.IndexOfAny(['?', '#']);
        if (cut >= 0)
        {
            value = value[..cut];
        }
        if (value.Length is 0 or > 256 || value[0] != '/' || value.StartsWith("//") || value.Any(c => char.IsControl(c) || char.IsWhiteSpace(c)))
        {
            return string.Empty;
        }
        string lower = value.ToLowerInvariant();
        if (lower.StartsWith("/admin") || lower.StartsWith("/api/") || lower.StartsWith("/_next/"))
        {
            return string.Empty;
        }
        return value.Length > 1 ? value.TrimEnd('/') : value;
    }

    private string ReferrerHost(string? referrer)
    {
        if (!Uri.TryCreate(referrer ?? string.Empty, UriKind.Absolute, out Uri? uri) || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return string.Empty;
        }
        string host = uri.Host.ToLowerInvariant();
        string siteHost = options.Value.Site.Host.ToLowerInvariant();
        if (host == siteHost || host.EndsWith("." + siteHost))
        {
            return string.Empty;
        }
        return host.StartsWith("www.") ? host[4..] : host;
    }

    private static string DeviceClass(string userAgent)
    {
        if (userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("Tablet", StringComparison.OrdinalIgnoreCase))
        {
            return "tablet";
        }
        return userAgent.Contains("Mobi", StringComparison.OrdinalIgnoreCase) ? "mobile" : "desktop";
    }

    private static string VisitorHash(string salt, string ip, string userAgent)
    {
        byte[] hash = HMACSHA256.HashData(Convert.FromBase64String(salt), Encoding.UTF8.GetBytes($"{ip}|{userAgent}"));
        return Convert.ToHexString(hash, 0, 12);
    }
}
