using System.Collections.Concurrent;
using Dhucar.Portfolio.Common.Tenancy;
using Dhucar.Portfolio.Properties.Settings;
using Fido2NetLib;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.Passkeys;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  The WebAuthn relying party for the current site. A passkey is bound to one domain, so each site
 *                    signs in against its own: the primary site uses the configured one, and any other site its first
 *                    host (accepting all its hosts as origins). A site without a host has no passkeys yet.
 */
public class PasskeyRelyingParty(IOptions<PortfolioSettings> options)
{
    private readonly ConcurrentDictionary<string, IFido2> _sites = new();

    /// <summary>The relying party for the current site.</summary>
    public IFido2 Current
    {
        get
        {
            TenantInfo? site = TenantScope.Current;
            if (site == null || site.Slug == TenantScope.PrimarySlug)
            {
                PasskeySettings passkeys = options.Value.Passkeys;
                return _sites.GetOrAdd(TenantScope.PrimarySlug, _ => Create(passkeys.RpId, passkeys.RpName, passkeys.Origins));
            }
            if (site.Hosts.Count == 0)
            {
                throw new InvalidOperationException($"Site {site.Slug} has no host yet, so it can't use passkeys.");
            }
            // Keyed by the hosts too, so a site's new domain takes effect without a restart.
            string key = site.Slug + "|" + string.Join(",", site.Hosts);
            return _sites.GetOrAdd(key, _ => Create(site.Hosts[0], site.Hosts[0], site.Hosts.Select(host => $"https://{host}")));
        }
    }

    private static Fido2 Create(string rpId, string rpName, IEnumerable<string> origins)
    {
        return new Fido2(new Fido2Configuration
        {
            RPID = rpId,
            RPName = rpName,
            Origins = origins.ToHashSet(),
            TimestampDriftTolerance = 300_000,
        }, null!);
    }
}
