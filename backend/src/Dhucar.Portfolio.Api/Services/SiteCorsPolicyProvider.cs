using Dhucar.Portfolio.Api.Middlewares;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Services
 * Modified By     :
 * Description     :  CORS for every site: the primary site's configured origins, plus https://<host> for each host a
 *                    registered, active site claims. Any other origin gets a policy that allows nothing.
 */
public class SiteCorsPolicyProvider(IOptions<PortfolioSettings> options) : ICorsPolicyProvider
{
    //****************************************************************************************************
    // Layer                 :   Services
    // Method Name           :   GetPolicyAsync
    // Method Description    :   The policy for this request's origin: allowed only if the primary site lists it or a site owns its host.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   context, policyName
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   CorsPolicy
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPolicyAsync : </c> The policy for this request's origin: allowed only if the primary site lists it or a site owns its host.
    /// </summary>
    public async Task<CorsPolicy?> GetPolicyAsync(HttpContext context, string? policyName)
    {
        string origin = context.Request.Headers.Origin.ToString();
        bool isAllowed = options.Value.Security.AllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
        // A site's own origin: exactly https://<host>, no port, path or user info.
        if (!isAllowed && Uri.TryCreate(origin, UriKind.Absolute, out Uri? uri) && uri.Scheme == Uri.UriSchemeHttps && origin == $"https://{uri.Host}")
        {
            isAllowed = await context.RequestServices.GetRequiredService<TenantBAL>().ResolveHost(uri.Host) != null;
        }
        CorsPolicyBuilder policy = new CorsPolicyBuilder()
            .WithMethods("GET", "POST")
            .WithHeaders("Content-Type", "Authorization", "X-Requested-With", TenantMiddleware.HeaderName)
            .AllowCredentials()
            .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
        if (isAllowed)
        {
            policy.WithOrigins(origin);
        }
        return policy.Build();
    }
}
