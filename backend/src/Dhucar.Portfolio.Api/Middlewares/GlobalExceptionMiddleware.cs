using Dhucar.Portfolio.Properties;

namespace Dhucar.Portfolio.Api.Middlewares;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Middlewares
 * Modified By     :
 * Description     :  Last-resort handler: logs anything uncaught and returns a generic JSON 500 (no stack traces).
 */
public class GlobalExceptionMiddleware(ILogger<GlobalExceptionMiddleware> logger) : IMiddleware
{
    //****************************************************************************************************
    // Layer                 :   Middlewares
    // Method Name           :   InvokeAsync
    // Method Description    :   Runs the pipeline and converts unhandled exceptions into the standard envelope.
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
    /// <c>InvokeAsync : </c> Runs the pipeline and converts unhandled exceptions into the standard envelope.
    /// </summary>
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            if (!context.Response.HasStarted)
            {
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new Response<object>
                {
                    ReturnCode = (int)ErrorCode.TechnicalError,
                    ReturnMessage = "Technical Error.",
                    ServerDate = DateTime.UtcNow,
                });
            }
        }
    }
}
