using Microsoft.AspNetCore.Mvc;

namespace Dhucar.Portfolio.Api.Filters;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Filters
 * Modified By     :
 * Description     :  Marks an endpoint the Next.js site calls server-to-server; checked in SiteSignatureFilter.
 */
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SiteSignatureAttribute : TypeFilterAttribute
{
    public SiteSignatureAttribute() : base(typeof(SiteSignatureFilter))
    {
    }
}
