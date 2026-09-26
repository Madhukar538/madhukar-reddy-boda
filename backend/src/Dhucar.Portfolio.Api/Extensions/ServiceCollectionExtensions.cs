using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Dhucar.Portfolio.Api.Middlewares;
using Dhucar.Portfolio.Api.Services;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Settings;
using Fido2NetLib;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Extensions;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Extensions
 * Modified By     :
 * Description     :  Composition root: settings, BAL/DAL scanning, security services, CORS and rate limits.
 */
public static class ServiceCollectionExtensions
{
    /// <summary>CORS policy name for the site's admin pages.</summary>
    public const string CorsPolicy = "site";

    //****************************************************************************************************
    // Layer                 :   Extensions
    // Method Name           :   AddPortfolioApi
    // Method Description    :   Registers everything the API needs.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   services, configuration
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   IServiceCollection
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>AddPortfolioApi : </c> Registers everything the API needs.
    /// </summary>
    public static IServiceCollection AddPortfolioApi(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<PortfolioSettings>().Bind(configuration.GetSection("Portfolio")).ValidateOnStart();
        services.AddSingleton<IValidateOptions<PortfolioSettings>, PortfolioSettingsValidator>();

        // Every *BAL and *DAL class is registered as scoped by naming convention.
        services.Scan(scan => scan
            .FromAssembliesOf(typeof(AuthBAL), typeof(UserDAL))
            .AddClasses(classes => classes.Where(type => type.Name.EndsWith("BAL") || type.Name.EndsWith("DAL")))
            .AsSelf()
            .WithScopedLifetime());

        services.AddHttpContextAccessor();
        services.AddScoped<IContextService, ContextService>();
        services.AddScoped<ICodeLogger, CodeLogger>();
        services.AddSingleton<MongoContext>();
        services.AddSingleton<TokenService>();
        services.TryAddSingleton(TimeProvider.System);
        services.AddSingleton<TotpService>();
        services.AddSingleton<SecretProtector>();
        services.AddSingleton<PasswordService>();
        services.AddSingleton<RecoveryCodeService>();
        services.AddSingleton<GlobalExceptionMiddleware>();
        services.AddSingleton<SecurityHeadersMiddleware>();
        services.AddHostedService<StartupTasks>();
        services.AddSingleton<IFido2>(serviceProvider =>
        {
            PasskeySettings passkeys = serviceProvider.GetRequiredService<IOptions<PortfolioSettings>>().Value.Passkeys;
            return new Fido2(new Fido2Configuration
            {
                RPID = passkeys.RpId,
                RPName = passkeys.RpName,
                Origins = passkeys.Origins.ToHashSet(),
                TimestampDriftTolerance = 300_000,
            }, null!);
        });
        services.AddHttpClient(RevalidationBAL.HttpClientName, client => client.Timeout = TimeSpan.FromSeconds(5))
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });

        // Resolved lazily from options, so the allowed origins always come from the final configuration.
        services.AddCors();
        services.AddOptions<Microsoft.AspNetCore.Cors.Infrastructure.CorsOptions>()
            .Configure<IOptions<PortfolioSettings>>((cors, portfolio) => cors.AddPolicy(CorsPolicy, policy => policy
                .WithOrigins(portfolio.Value.Security.AllowedOrigins.ToArray())
                .WithMethods("GET", "POST")
                .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
                .AllowCredentials()
                .SetPreflightMaxAge(TimeSpan.FromMinutes(10))));

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                await context.HttpContext.Response.WriteAsJsonAsync(new Response<object>
                {
                    ReturnCode = (int)ErrorCode.LockedOut,
                    ReturnMessage = "Too many requests. Slow down and try again shortly.",
                    ServerDate = DateTime.UtcNow,
                }, cancellationToken);
            };
            AddPerIpPolicy(options, "auth", security => Math.Clamp(security.AuthRequestsPerMinute, 1, 10_000));
            AddPerIpPolicy(options, "admin", _ => 120);
            AddPerIpPolicy(options, "public", _ => 240);
            AddPerIpPolicy(options, "track", _ => 60);
        });

        services.AddControllers()
            .ConfigureApiBehaviorOptions(options =>
            {
                // Malformed JSON gets the standard envelope instead of framework ProblemDetails.
                options.InvalidModelStateResponseFactory = _ => new BadRequestObjectResult(new Response<object>
                {
                    ReturnCode = (int)ErrorCode.ValidationFailed,
                    ReturnMessage = "Missing or invalid parameters.",
                    ServerDate = DateTime.UtcNow,
                });
            });
        return services;
    }

    private static void AddPerIpPolicy(RateLimiterOptions options, string name, Func<SecuritySettings, int> permitsPerMinute)
    {
        options.AddPolicy(name, httpContext => RateLimitPartition.GetFixedWindowLimiter(
            httpContext.RequestServices.GetRequiredService<IContextService>().GetClientIp(),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitsPerMinute(httpContext.RequestServices.GetRequiredService<IOptions<PortfolioSettings>>().Value.Security),
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
    }
}
