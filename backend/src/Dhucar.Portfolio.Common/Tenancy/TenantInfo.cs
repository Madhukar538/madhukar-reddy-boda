namespace Dhucar.Portfolio.Common.Tenancy;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  A resolved site: its slug, the MongoDB database that holds its data, and the host names that serve it
 *                    (none for the primary site, whose origins come from configuration).
 */
public sealed record TenantInfo(string Slug, string Database, IReadOnlyList<string> Hosts);
