namespace Dhucar.Portfolio.Api.Middlewares;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Middlewares
 * Modified By     :
 * Description     :  Adds security headers to every response; the API serves JSON only, so the CSP forbids everything.
 */
public class SecurityHeadersMiddleware(IWebHostEnvironment environment) : IMiddleware
{
    //****************************************************************************************************
    // Layer                 :   Middlewares
    // Method Name           :   InvokeAsync
    // Method Description    :   Sets headers before the response starts.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   context, next
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InvokeAsync : </c> Sets headers before the response starts.
    /// </summary>
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        bool isSwagger = environment.IsDevelopment() && context.Request.Path.StartsWithSegments("/swagger");
        context.Response.OnStarting(() =>
        {
            IHeaderDictionary headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            headers["Cross-Origin-Resource-Policy"] = "same-site";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
            if (!environment.IsDevelopment())
            {
                // Sent on every response: behind Cloudflare Tunnel requests arrive as plain HTTP, where UseHsts() would skip it.
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }
            if (!isSwagger)
            {
                headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
                headers["Cache-Control"] = "no-store";
            }
            return Task.CompletedTask;
        });
        await next(context);
    }
}
