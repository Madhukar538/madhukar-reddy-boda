using System.Security.Claims;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Common.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Reads request context from the current HttpContext.
 */
public class ContextService(IHttpContextAccessor httpContextAccessor, IOptions<PortfolioSettings> options) : IContextService
{
    private readonly bool _isCloudflareTrusted = options.Value.Security.IsCloudflareTrusted;
    private readonly bool _isCookieSecure = options.Value.Security.IsCookieSecure;

    // __Host- cookies must be Secure, path "/" and have no Domain, so they can't be set or read by other subdomains.
    private string RefreshCookieName => _isCookieSecure ? "__Host-dhucar_rt" : "dhucar_rt";

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetClientIp
    // Method Description    :   Returns the client IP address (Cloudflare header only when trusted).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetClientIp : </c> Returns the client IP address (Cloudflare header only when trusted).
    /// </summary>
    public string GetClientIp()
    {
        HttpContext? context = httpContextAccessor.HttpContext;
        if (context == null)
        {
            return string.Empty;
        }
        if (_isCloudflareTrusted)
        {
            string cloudflareIp = context.Request.Headers["CF-Connecting-IP"].ToString();
            if (System.Net.IPAddress.TryParse(cloudflareIp, out System.Net.IPAddress? parsed))
            {
                return parsed.ToString();
            }
        }
        return context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetUserAgent
    // Method Description    :   Returns the user agent, truncated to 256 characters.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetUserAgent : </c> Returns the user agent, truncated to 256 characters.
    /// </summary>
    public string GetUserAgent()
    {
        string userAgent = GetHeader("User-Agent");
        return userAgent.Length > 256 ? userAgent[..256] : userAgent;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetCountry
    // Method Description    :   Returns the CDN-reported two-letter country, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetCountry : </c> Returns the CDN-reported two-letter country, or empty.
    /// </summary>
    public string GetCountry()
    {
        if (!_isCloudflareTrusted)
        {
            return string.Empty;
        }
        string country = GetHeader("CF-IPCountry").ToUpperInvariant();
        return country.Length == 2 && country.All(char.IsAsciiLetterUpper) && country != "XX" && country != "T1" ? country : string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetHeader
    // Method Description    :   Returns a request header value, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   name
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetHeader : </c> Returns a request header value, or empty.
    /// </summary>
    public string GetHeader(string name)
    {
        return httpContextAccessor.HttpContext?.Request.Headers[name].ToString() ?? string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetUserId
    // Method Description    :   Returns the authenticated admin's user id, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetUserId : </c> Returns the authenticated admin's user id, or empty.
    /// </summary>
    public string GetUserId()
    {
        return httpContextAccessor.HttpContext?.User.FindFirstValue("sub") ?? string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetEmail
    // Method Description    :   Returns the authenticated admin's email, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetEmail : </c> Returns the authenticated admin's email, or empty.
    /// </summary>
    public string GetEmail()
    {
        return httpContextAccessor.HttpContext?.User.FindFirstValue("email") ?? string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetClaim
    // Method Description    :   Returns a claim of the authenticated admin, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   type
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetClaim : </c> Returns a claim of the authenticated admin, or empty.
    /// </summary>
    public string GetClaim(string type)
    {
        return httpContextAccessor.HttpContext?.User.FindFirstValue(type) ?? string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetRefreshCookie
    // Method Description    :   Returns the refresh token from its HttpOnly cookie, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetRefreshCookie : </c> Returns the refresh token from its HttpOnly cookie, or empty.
    /// </summary>
    public string GetRefreshCookie()
    {
        return httpContextAccessor.HttpContext?.Request.Cookies[RefreshCookieName] ?? string.Empty;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   SetRefreshCookie
    // Method Description    :   Writes the refresh token as an HttpOnly, SameSite=Strict cookie.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   token, expiresAt
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SetRefreshCookie : </c> Writes the refresh token as an HttpOnly, SameSite=Strict cookie.
    /// </summary>
    public void SetRefreshCookie(string token, DateTime expiresAt)
    {
        httpContextAccessor.HttpContext?.Response.Cookies.Append(RefreshCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = _isCookieSecure,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = expiresAt,
            IsEssential = true,
        });
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   ClearRefreshCookie
    // Method Description    :   Deletes the refresh cookie.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ClearRefreshCookie : </c> Deletes the refresh cookie.
    /// </summary>
    public void ClearRefreshCookie()
    {
        httpContextAccessor.HttpContext?.Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = _isCookieSecure,
            SameSite = SameSiteMode.Strict,
            Path = "/",
        });
    }
}
