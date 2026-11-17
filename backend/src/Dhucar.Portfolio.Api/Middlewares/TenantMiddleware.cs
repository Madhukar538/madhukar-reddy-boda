using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Tenancy;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Middlewares;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :  17 Nov 2026
 * Modified Reason :  A browser's origin must belong to the site it asks for; image URLs can name their site
 * Layer           :  Middleware
 * Modified By     :
 * Description     :  Picks the site each request is for and scopes it (TenantScope), so its data comes from that
 *                    site's database: the X-Tenant header (a site's server), else X-Tenant-Host (a site's domain, from
 *                    the Next.js app serving it), else the browser's Origin host, else
 *                    the primary site. A named site that is unknown or suspended gets 404, never another site's data.
 *                    Sign-in is per site as well: a token carries its site and is refused on any other.
 */
public class TenantMiddleware(IOptions<PortfolioSettings> options) : IMiddleware
{
    /// <summary>The header a site's server names its site with.</summary>
    public const string HeaderName = "X-Tenant";

    /// <summary>The header a site's server names its site with by domain (the Next.js app serving that domain).</summary>
    public const string HostHeaderName = "X-Tenant-Host";

    /// <summary>The query parameter that names the site on a public image URL (/media/x.webp?site=asha), which browsers fetch without headers.</summary>
    public const string MediaQueryName = "site";

    /// <summary>Where the resolved site is kept for the rest of the request (and SignalR connections).</summary>
    public const string ItemKey = "tenant";

    private static readonly TenantInfo Primary = new TenantInfo(TenantScope.PrimarySlug, string.Empty, []);

    //****************************************************************************************************
    // Layer                 :   Middleware
    // Method Name           :   InvokeAsync
    // Method Description    :   Resolves the request's site, then runs the rest of the pipeline in its scope.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   context, next
    // Modified Date         :   17 Nov 2026
    // Modified Reason       :   A browser's origin and the named site must agree; image URLs name their site
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //  1.1        Boda Madhukar Reddy    17 Nov 2026       Origin and named site must agree; ?site= on images
    //  1.2        Boda Madhukar Reddy    17 Nov 2026       X-Tenant-Host names a site by its domain
    //****************************************************************************************************
    /// <summary>
    /// <c>InvokeAsync : </c> Resolves the request's site, then runs the rest of the pipeline in its scope.
    /// </summary>
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        TenantBAL tenantBAL = context.RequestServices.GetRequiredService<TenantBAL>();
        string named = context.Request.Headers[HeaderName].ToString().Trim();
        if (named.Length == 0 && HttpMethods.IsGet(context.Request.Method) && context.Request.Path.StartsWithSegments("/media"))
        {
            named = context.Request.Query[MediaQueryName].ToString().Trim();
        }
        // The site a browser's page belongs to: a registered site's host, the primary site's own origins, or none.
        string origin = context.Request.Headers.Origin.ToString();
        TenantInfo? originSite = null;
        if (options.Value.Security.AllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            originSite = Primary;
        }
        else if (Uri.TryCreate(origin, UriKind.Absolute, out Uri? uri))
        {
            originSite = await tenantBAL.ResolveHost(uri.Host);
        }

        string namedHost = context.Request.Headers[HostHeaderName].ToString().Trim();
        TenantInfo? tenant = named.Length > 0 ? await tenantBAL.Resolve(named)
            : namedHost.Length > 0 ? await tenantBAL.ResolveHost(namedHost)
            : originSite ?? Primary;
        // A page on one site can't ask for another site (its token and data belong to its own).
        if (tenant != null && originSite != null && originSite.Slug != tenant.Slug)
        {
            tenant = null;
        }
        if (tenant == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new Response<object>
            {
                ReturnCode = (int)ErrorCode.NotFound,
                ReturnMessage = "Unknown site.",
                ServerDate = DateTime.UtcNow,
            });
            return;
        }
        context.Items[ItemKey] = tenant;
        using (TenantScope.Use(tenant.Slug == TenantScope.PrimarySlug ? null : tenant))
        {
            await next(context);
        }
    }
}
