using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Tenancy;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;
using Microsoft.Extensions.Caching.Memory;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Sites on the platform: resolving the site a request is for (by slug or host, cached briefly)
 *                    and adding a site, each with its own database.
 */
public partial class TenantBAL(TenantDAL tenantDAL, MongoContext mongoContext, SettingsDAL settingsDAL, IMemoryCache memoryCache, ICodeLogger codeLog)
{
    /// <summary>How long a lookup is remembered; a new or suspended site takes effect within this.</summary>
    private static readonly TimeSpan CacheFor = TimeSpan.FromSeconds(60);

    /// <summary>Slugs no site can take (platform names and the primary site's).</summary>
    private static readonly HashSet<string> ReservedSlugs =
    [
        TenantScope.PrimarySlug, "www", "api", "admin", "app", "mail", "static", "assets", "cdn", "status", "docs", "help", "dhucar", "platform", "system", "root",
    ];

    private const int MaxHosts = 5;

    [GeneratedRegex("^[a-z][a-z0-9-]{2,31}$")]
    private static partial Regex SlugPattern();

    [GeneratedRegex("^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$")]
    private static partial Regex HostPattern();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Resolve
    // Method Description    :   The active site with this slug, or null (unknown and suspended sites alike); "main" is the primary site.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   TenantInfo
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Resolve : </c> The active site with this slug, or null (unknown and suspended sites alike); "main" is the primary site.
    /// </summary>
    public async Task<TenantInfo?> Resolve(string slug)
    {
        slug = (slug ?? string.Empty).Trim().ToLowerInvariant();
        if (slug == TenantScope.PrimarySlug)
        {
            return new TenantInfo(TenantScope.PrimarySlug, string.Empty);
        }
        if (!SlugPattern().IsMatch(slug))
        {
            return null;
        }
        return await memoryCache.GetOrCreateAsync($"tenant:slug:{slug}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheFor;
            return ToInfo(await tenantDAL.GetTenantDB(slug));
        });
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ResolveHost
    // Method Description    :   The active site a host name belongs to, or null when no site claims it.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   host
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   TenantInfo
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ResolveHost : </c> The active site a host name belongs to, or null when no site claims it.
    /// </summary>
    public async Task<TenantInfo?> ResolveHost(string host)
    {
        host = (host ?? string.Empty).Trim().ToLowerInvariant();
        if (!HostPattern().IsMatch(host))
        {
            return null;
        }
        return await memoryCache.GetOrCreateAsync($"tenant:host:{host}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheFor;
            return ToInfo(await tenantDAL.GetTenantByHostDB(host));
        });
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Provision
    // Method Description    :   Adds a site with its own empty database (indexes and default settings created); refuses taken or reserved slugs and hosts.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Provision : </c> Adds a site with its own empty database (indexes and default settings created); refuses taken or reserved slugs and hosts.
    /// </summary>
    public async Task<Response<object>> Provision(ProvisionTenantRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim().ToLowerInvariant();
            string name = (objAPIRequest.Name ?? string.Empty).Trim();
            List<string> hosts = (objAPIRequest.Hosts ?? []).Select(x => (x ?? string.Empty).Trim().ToLowerInvariant()).Where(x => x.Length > 0).Distinct().ToList();
            string error = !SlugPattern().IsMatch(slug) ? "The slug must be 3–32 lower-case letters, digits or hyphens, starting with a letter."
                : ReservedSlugs.Contains(slug) ? "That slug is reserved."
                : name.Length is 0 or > 120 ? "A name of up to 120 characters is required."
                : hosts.Count > MaxHosts ? $"Up to {MaxHosts} hosts."
                : hosts.Any(x => !HostPattern().IsMatch(x)) ? "Each host must be a plain domain name, such as asha.example.com."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            TenantDocument tenant = new TenantDocument
            {
                Id = slug,
                Name = name,
                Hosts = hosts,
                Database = "site_" + slug,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
            };
            if (!await tenantDAL.InsertTenantDB(tenant))
            {
                objResponse.ReturnCode = (int)ErrorCode.Conflict;
                objResponse.ReturnMessage = "That slug or one of those hosts is already taken.";
                return objResponse;
            }
            // The new site's own database: the same indexes and default switches every site starts with.
            using (TenantScope.Use(new TenantInfo(tenant.Id, tenant.Database)))
            {
                await mongoContext.EnsureIndexes();
                await settingsDAL.EnsureSecuritySettingsDB();
            }
            memoryCache.Remove($"tenant:slug:{slug}");
            hosts.ForEach(x => memoryCache.Remove($"tenant:host:{x}"));
            objResponse.Data = new SaveResultDTO { Id = slug };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Site created.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step Provision", string.Empty, nameof(Provision));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>A registry entry as a resolved site; null unless it is active.</summary>
    private static TenantInfo? ToInfo(TenantDocument? tenant)
    {
        return tenant is { Status: "active" } ? new TenantInfo(tenant.Id, tenant.Database) : null;
    }
}
