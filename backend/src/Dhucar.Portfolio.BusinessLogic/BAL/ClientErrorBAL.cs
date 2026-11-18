using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Script errors from visitors' browsers, grouped by message and place and counted, for the admin.
 *                    Nothing that identifies a visitor is kept: no IP, cookie, id or full user agent; emails, long
 *                    numbers and query strings are masked out of what is stored.
 */
public partial class ClientErrorBAL(ClientErrorDAL clientErrorDAL, AuditBAL auditBAL, NotificationBAL notificationBAL, IContextService contextService, TimeProvider timeProvider, ICodeLogger codeLog)
{
    /// <summary>Most error groups kept; new kinds are dropped once the list is full, until some are cleared.</summary>
    public const int MaxGroups = 200;

    /// <summary>Most groups the admin list shows.</summary>
    public const int ListLimit = 100;

    /// <summary>Most "new kind of error" alerts sent in an hour, so a burst of junk reports can't flood the phone.</summary>
    public const int AlertsPerHour = 5;

    private static readonly Queue<DateTime> _alertTimes = new();
    private static readonly object _alertLock = new();

    [GeneratedRegex(@"bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|httpclient|go-http|java/|scrapy|uptime", RegexOptions.IgnoreCase)]
    private static partial Regex BotPattern();

    [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")]
    private static partial Regex EmailPattern();

    [GeneratedRegex(@"\d{6,}")]
    private static partial Regex LongNumberPattern();

    [GeneratedRegex(@"\b[a-z][a-z0-9+.-]*://[^\s'"")\]]+", RegexOptions.IgnoreCase)]
    private static partial Regex UrlPattern();

    [GeneratedRegex(@":\d+(:\d+)?$")]
    private static partial Regex PositionPattern();

    [GeneratedRegex(@"(chrome|moz|safari(-web)?|ms-browser)-extension://", RegexOptions.IgnoreCase)]
    private static partial Regex ExtensionPattern();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ReportClientError
    // Method Description    :   Records one script error from a visitor's browser in its group, skipping bots, browser extensions and errors with no detail.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ReportClientError : </c> Records one script error from a visitor's browser in its group, skipping bots, browser extensions and errors with no detail.
    /// </summary>
    public async Task<Response<object>> ReportClientError(ReportClientErrorRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string message = Clean(objAPIRequest.Message, 300);
            string page = TrafficBAL.NormalizePath(objAPIRequest.Page);
            if (message.Length == 0 || page.Length == 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "A message and a page are required.";
                return objResponse;
            }
            // Accepted either way from here, so the browser learns nothing about what was kept.
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "OK.";
            string userAgent = contextService.GetUserAgent();
            string rawSource = objAPIRequest.Source ?? string.Empty;
            string rawStack = objAPIRequest.Stack ?? string.Empty;
            // "Script error." is all a browser says about another origin's script: nothing to act on.
            if (userAgent.Length == 0 || BotPattern().IsMatch(userAgent) || message == "Script error." || ExtensionPattern().IsMatch(rawSource) || ExtensionPattern().IsMatch(rawStack))
            {
                return objResponse;
            }
            string source = PathOf(rawSource);
            int line = Math.Clamp(objAPIRequest.Line, 0, 10_000_000);
            int column = Math.Clamp(objAPIRequest.Column, 0, 10_000_000);
            DateTime now = timeProvider.GetUtcNow().UtcDateTime;
            ClientErrorDocument error = new ClientErrorDocument
            {
                Id = GroupId(message, source, line, column),
                Message = message,
                Source = source,
                Line = line,
                Column = column,
                Stack = CleanStack(rawStack),
                Page = page,
                Look = ThemeBAL.Registry.Any(t => t.Id == objAPIRequest.Look) ? objAPIRequest.Look : string.Empty,
                Browser = BrowserFamily(userAgent),
                FirstSeen = now,
                LastSeen = now,
            };
            string outcome = await clientErrorDAL.RecordClientErrorDB(error, MaxGroups);
            if (outcome == "new" && IsAlertAllowed(now))
            {
                await notificationBAL.SendAlert(
                    $"⚠️ <b>New script error on the site</b>\n{NotificationBAL.Escape(error.Message)}\n{NotificationBAL.Escape(error.Page)} · {NotificationBAL.Escape(error.Browser)}" +
                    (error.Look.Length > 0 ? $" · {NotificationBAL.Escape(error.Look)}" : string.Empty) +
                    "\nAdmin → Errors");
            }
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step ReportClientError", string.Empty, nameof(ReportClientError));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetClientErrors
    // Method Description    :   The most recently seen browser error groups, with their counts.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetClientErrors : </c> The most recently seen browser error groups, with their counts.
    /// </summary>
    public async Task<Response<object>> GetClientErrors()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<ClientErrorDocument> errors = await clientErrorDAL.GetClientErrorsDB(ListLimit);
            objResponse.Data = errors.Select(x => new ClientErrorDTO
            {
                Id = x.Id,
                Message = x.Message,
                Source = x.Source,
                Line = x.Line,
                Column = x.Column,
                Stack = x.Stack,
                Page = x.Page,
                Look = x.Look,
                Browser = x.Browser,
                Count = x.Count,
                FirstSeen = x.FirstSeen,
                LastSeen = x.LastSeen,
            }).ToList();
            objResponse.RowCount = errors.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Browser errors.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetClientErrors", string.Empty, nameof(GetClientErrors));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ClearClientErrors
    // Method Description    :   Clears one browser error group once it is fixed, or all of them.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ClearClientErrors : </c> Clears one browser error group once it is fixed, or all of them.
    /// </summary>
    public async Task<Response<object>> ClearClientErrors(ClearClientErrorsRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string id = (objAPIRequest.Id ?? string.Empty).Trim();
            long cleared = await clientErrorDAL.DeleteClientErrorsDB(id);
            await auditBAL.Write("clientErrors.cleared", true, contextService.GetUserId(), contextService.GetEmail(), id.Length == 0 ? $"all ({cleared})" : id);
            objResponse.Data = cleared;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = cleared == 1 ? "1 error cleared." : $"{cleared} errors cleared.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step ClearClientErrors", string.Empty, nameof(ClearClientErrors));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>True while fewer than AlertsPerHour alerts have gone out in the last hour; records this one.</summary>
    private static bool IsAlertAllowed(DateTime now)
    {
        lock (_alertLock)
        {
            while (_alertTimes.Count > 0 && now - _alertTimes.Peek() > TimeSpan.FromHours(1))
            {
                _alertTimes.Dequeue();
            }
            if (_alertTimes.Count >= AlertsPerHour)
            {
                return false;
            }
            _alertTimes.Enqueue(now);
            return true;
        }
    }

    /// <summary>One line of text with addresses reduced to their path and emails and long numbers masked, cut to max characters.</summary>
    private static string Clean(string? text, int max)
    {
        // A stack frame's :line:column follows the query string, so it is put back after the path.
        string value = UrlPattern().Replace(text ?? string.Empty, m => PathOf(PositionPattern().Replace(m.Value, string.Empty)) + PositionPattern().Match(m.Value).Value);
        value = EmailPattern().Replace(value, "[email]");
        value = LongNumberPattern().Replace(value, "[n]");
        value = string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return value.Length > max ? value[..max] : value;
    }

    /// <summary>The first dozen stack lines, each cleaned, at most 2000 characters in all.</summary>
    private static string CleanStack(string stack)
    {
        IEnumerable<string> lines = stack.Split('\n').Select(l => Clean(l, 240)).Where(l => l.Length > 0).Take(12);
        string value = string.Join('\n', lines);
        return value.Length > 2000 ? value[..2000] : value;
    }

    /// <summary>An address's path only (no host, query or fragment), or empty when it isn't a web address.</summary>
    private static string PathOf(string url)
    {
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out Uri? uri) || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return string.Empty;
        }
        string path = uri.AbsolutePath;
        return path.Length > 200 ? path[..200] : path;
    }

    private static string GroupId(string message, string source, int line, int column)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{message}|{source}|{line}|{column}"));
        return Convert.ToHexString(hash, 0, 12).ToLowerInvariant();
    }

    private static string BrowserFamily(string userAgent)
    {
        if (userAgent.Contains("Edg/", StringComparison.Ordinal))
        {
            return "Edge";
        }
        if (userAgent.Contains("Firefox/", StringComparison.Ordinal) || userAgent.Contains("FxiOS/", StringComparison.Ordinal))
        {
            return "Firefox";
        }
        if (userAgent.Contains("Chrome/", StringComparison.Ordinal) || userAgent.Contains("CriOS/", StringComparison.Ordinal))
        {
            return "Chrome";
        }
        return userAgent.Contains("Safari/", StringComparison.Ordinal) ? "Safari" : "Other";
    }
}
