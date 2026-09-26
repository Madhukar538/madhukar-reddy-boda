using Microsoft.AspNetCore.Mvc;

namespace Dhucar.Portfolio.Api.Filters;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Filters
 * Modified By     :
 * Description     :  Marks a controller as admin-only; validation happens in JwtAuthenticationFilter.
 */
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class JwtAuthenticationAttribute : TypeFilterAttribute
{
    public JwtAuthenticationAttribute() : base(typeof(JwtAuthenticationFilter))
    {
    }
}
