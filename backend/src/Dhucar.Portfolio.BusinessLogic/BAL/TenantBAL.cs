using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
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
public partial class TenantBAL(TenantDAL tenantDAL, MongoContext mongoContext, SettingsDAL settingsDAL, AuditBAL auditBAL, IContextService contextService, IMemoryCache memoryCache, ICodeLogger codeLog)
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
            return new TenantInfo(TenantScope.PrimarySlug, string.Empty, []);
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
            // The site's own setup token: only its hash is kept, so it can't be read back later.
            string setupToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
            TenantDocument tenant = new TenantDocument
            {
                Id = slug,
                Name = name,
                Hosts = hosts,
                Database = "site_" + slug,
                Status = "active",
                SetupTokenHash = HashToken(setupToken),
                CreatedAt = DateTime.UtcNow,
            };
            if (!await tenantDAL.InsertTenantDB(tenant))
            {
                objResponse.ReturnCode = (int)ErrorCode.Conflict;
                objResponse.ReturnMessage = "That slug or one of those hosts is already taken.";
                return objResponse;
            }
            // The new site's own database: the same indexes and default switches every site starts with.
            using (TenantScope.Use(new TenantInfo(tenant.Id, tenant.Database, tenant.Hosts)))
            {
                await mongoContext.EnsureIndexes();
                await settingsDAL.EnsureSecuritySettingsDB();
            }
            memoryCache.Remove($"tenant:slug:{slug}");
            hosts.ForEach(x => memoryCache.Remove($"tenant:host:{x}"));
            objResponse.Data = new ProvisionResultDTO { Id = slug, SetupToken = setupToken };
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

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetSites
    // Method Description    :   Every site on the platform, for the primary admin only.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetSites : </c> Every site on the platform, for the primary admin only.
    /// </summary>
    public async Task<Response<object>> GetSites()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            if (!TenantScope.IsPrimary)
            {
                return Refuse(objResponse);
            }
            objResponse.Data = (await tenantDAL.GetAllTenantsDB()).Select(x => new SiteListItemDTO { Id = x.Id, Name = x.Name, Hosts = x.Hosts, Status = x.Status, CreatedAt = x.CreatedAt }).ToList();
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Sites.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetSites", string.Empty, nameof(GetSites));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   CreateSite
    // Method Description    :   Adds a site from the primary admin and returns its setup token once.
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
    /// <c>CreateSite : </c> Adds a site from the primary admin and returns its setup token once.
    /// </summary>
    public async Task<Response<object>> CreateSite(ProvisionTenantRequestDTO objAPIRequest)
    {
        if (!TenantScope.IsPrimary)
        {
            return Refuse(new Response<object> { ServerDate = DateTime.UtcNow });
        }
        Response<object> objResponse = await Provision(objAPIRequest);
        await auditBAL.Write("site.created", objResponse.ReturnCode == (int)ErrorCode.Success, contextService.GetUserId(), contextService.GetEmail(), (objAPIRequest.Slug ?? string.Empty).Trim().ToLowerInvariant());
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SetSiteStatus
    // Method Description    :   Suspends or reactivates a site from the primary admin; a suspended site answers like an unknown one.
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
    /// <c>SetSiteStatus : </c> Suspends or reactivates a site from the primary admin; a suspended site answers like an unknown one.
    /// </summary>
    public async Task<Response<object>> SetSiteStatus(SetSiteStatusRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            if (!TenantScope.IsPrimary)
            {
                return Refuse(objResponse);
            }
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim().ToLowerInvariant();
            string status = (objAPIRequest.Status ?? string.Empty).Trim().ToLowerInvariant();
            if (status is not ("active" or "suspended"))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Status must be active or suspended.";
                return objResponse;
            }
            TenantDocument? tenant = SlugPattern().IsMatch(slug) ? await tenantDAL.GetTenantDB(slug) : null;
            if (tenant == null || !await tenantDAL.SetTenantStatusDB(slug, status))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "No such site.";
                return objResponse;
            }
            // Takes effect at once on this server (other servers within the cache time).
            memoryCache.Remove($"tenant:slug:{slug}");
            tenant.Hosts.ForEach(x => memoryCache.Remove($"tenant:host:{x}"));
            await auditBAL.Write("site.status", true, contextService.GetUserId(), contextService.GetEmail(), $"{slug}: {status}");
            objResponse.Data = new SaveResultDTO { Id = slug };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = status == "active" ? "Site reactivated." : "Site suspended.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SetSiteStatus", string.Empty, nameof(SetSiteStatus));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>Only the primary site's admin manages sites: any other site's admin is refused.</summary>
    private static Response<object> Refuse(Response<object> objResponse)
    {
        objResponse.ReturnCode = (int)ErrorCode.Forbidden;
        objResponse.ReturnMessage = "Only the platform's own admin can manage sites.";
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   IsSetupToken
    // Method Description    :   True when the token is the current site's own setup token (compared by hash, in constant time).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   token
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>IsSetupToken : </c> True when the token is the current site's own setup token (compared by hash, in constant time).
    /// </summary>
    public async Task<bool> IsSetupToken(string token)
    {
        TenantDocument? tenant = await tenantDAL.GetTenantDB(TenantScope.Slug);
        if (tenant == null || tenant.SetupTokenHash.Length == 0 || string.IsNullOrEmpty(token))
        {
            return false;
        }
        return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(HashToken(token)), Encoding.ASCII.GetBytes(tenant.SetupTokenHash));
    }

    /// <summary>SHA-256 of a token, as lower-case hex.</summary>
    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
    }

    /// <summary>A registry entry as a resolved site; null unless it is active.</summary>
    private static TenantInfo? ToInfo(TenantDocument? tenant)
    {
        return tenant is { Status: "active" } ? new TenantInfo(tenant.Id, tenant.Database, tenant.Hosts) : null;
    }
}
