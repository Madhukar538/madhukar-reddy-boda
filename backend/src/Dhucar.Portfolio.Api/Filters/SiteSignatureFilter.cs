using System.Security.Cryptography;
using System.Text;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Filters;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Filters
 * Modified By     :
 * Description     :  Accepts a request only when it carries a fresh timestamp and an HMAC-SHA256 signature over "timestamp.body" made with the shared site secret (the same scheme the API uses towards the site). Runs before model binding.
 */
public class SiteSignatureFilter(IOptions<PortfolioSettings> options) : IAsyncResourceFilter
{
    private const int MaxAgeSeconds = 5 * 60;

    //****************************************************************************************************
    // Layer                 :   Filters
    // Method Name           :   OnResourceExecutionAsync
    // Method Description    :   Verifies the timestamp and signature on the raw body, then lets the request continue.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   context, next
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>OnResourceExecutionAsync : </c> Verifies the timestamp and signature on the raw body, then lets the request continue.
    /// </summary>
    public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
    {
        string secret = options.Value.Site.RevalidateSecret;
        HttpRequest request = context.HttpContext.Request;
        string timestamp = request.Headers["X-Timestamp"].ToString();
        string signature = request.Headers["X-Signature"].ToString();
        request.EnableBuffering();
        string body;
        using (StreamReader reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
        {
            body = await reader.ReadToEndAsync();
        }
        request.Body.Position = 0;
        bool isFresh = long.TryParse(timestamp, out long seconds) && Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - seconds) <= MaxAgeSeconds;
        bool isSigned = secret.Length >= 32 && isFresh && CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(RequestSigner.Sign(secret, timestamp, body)),
            Encoding.UTF8.GetBytes(signature));
        if (!isSigned)
        {
            context.Result = new ObjectResult(new Response<object>
            {
                ReturnCode = (int)ErrorCode.Unauthorized,
                ReturnMessage = "Bad or missing signature.",
                ServerDate = DateTime.UtcNow,
            })
            { StatusCode = StatusCodes.Status401Unauthorized };
            return;
        }
        await next();
    }
}
