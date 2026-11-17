namespace Dhucar.Portfolio.Common.Tenancy;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  A resolved site: its slug and the MongoDB database that holds its data.
 */
public sealed record TenantInfo(string Slug, string Database);
