using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Tenancy;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.Api.Middlewares;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Middleware
 * Modified By     :
 * Description     :  Picks the site each request is for and scopes it (TenantScope), so its data comes from that
 *                    site's database: the X-Tenant header (a site's server), else the browser's Origin host, else
 *                    the primary site. A named site that is unknown or suspended gets 404, never another site's data.
 *                    Sign-in is per site as well: a token carries its site and is refused on any other.
 */
public class TenantMiddleware : IMiddleware
{
    /// <summary>The header a site's server names its site with.</summary>
    public const string HeaderName = "X-Tenant";

    /// <summary>Where the resolved site is kept for the rest of the request (and SignalR connections).</summary>
    public const string ItemKey = "tenant";

    //****************************************************************************************************
    // Layer                 :   Middleware
    // Method Name           :   InvokeAsync
    // Method Description    :   Resolves the request's site, then runs the rest of the pipeline in its scope.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   context, next
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InvokeAsync : </c> Resolves the request's site, then runs the rest of the pipeline in its scope.
    /// </summary>
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        TenantBAL tenantBAL = context.RequestServices.GetRequiredService<TenantBAL>();
        string named = context.Request.Headers[HeaderName].ToString().Trim();
        TenantInfo? tenant;
        if (named.Length > 0)
        {
            tenant = await tenantBAL.Resolve(named);
        }
        else
        {
            // A browser on another site's domain; anything unclaimed (the primary site's own origins included) is the primary site.
            string origin = context.Request.Headers.Origin.ToString();
            TenantInfo? byHost = Uri.TryCreate(origin, UriKind.Absolute, out Uri? uri) ? await tenantBAL.ResolveHost(uri.Host) : null;
            tenant = byHost ?? new TenantInfo(TenantScope.PrimarySlug, string.Empty);
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
