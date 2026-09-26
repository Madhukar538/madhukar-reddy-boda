/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Api
 * Modified By     :
 * Description     :  Host setup: Kestrel limits, services, and the middleware pipeline (exceptions, security headers, CORS, rate limits).
 */
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.Api.Middlewares;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.Limits.MaxRequestBodySize = 512 * 1024;
});

builder.Services.AddPortfolioApi(builder.Configuration);
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

WebApplication app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors(Dhucar.Portfolio.Api.Extensions.ServiceCollectionExtensions.CorsPolicy);
app.UseRateLimiter();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// Exposed for integration tests (WebApplicationFactory).
public partial class Program
{
}
