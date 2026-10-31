/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  31 Oct 2026
 * Modified Reason :  /health no longer asks for an Atlas access-list sync
 * Layer           :  Api
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Host setup: Kestrel limits, services, and the middleware pipeline (exceptions, security headers, CORS, rate limits).
 */
using Dhucar.Portfolio.Api.Extensions;
using Dhucar.Portfolio.Api.Hubs;
using Dhucar.Portfolio.Api.Middlewares;
using Dhucar.Portfolio.BusinessLogic;
using Dhucar.Portfolio.DataAccess;
using MongoDB.Bson;
using MongoDB.Driver;

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
app.MapHub<PresenceHub>("/hubs/presence");
// Liveness, plus which release is running (the site's footer shows it).
string apiVersion = typeof(Program).Assembly.GetName().Version is { } v ? $"{v.Major}.{v.Minor}.{v.Build}" : "0.0.0";
string apiCommit = (Environment.GetEnvironmentVariable("SOURCE_COMMIT") ?? string.Empty) is { Length: >= 7 } sha ? sha[..7] : string.Empty;
// Always 200 while the process runs (a database outage must not get the container restarted);
// the database's own state and round trip are reported alongside, for the site's /status page.
app.MapGet("/health", async (MongoContext mongo, CancellationToken requestAborted) =>
{
    string db = "down";
    long? dbMs = null;
    using CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(requestAborted);
    timeout.CancelAfter(TimeSpan.FromSeconds(1));
    System.Diagnostics.Stopwatch watch = System.Diagnostics.Stopwatch.StartNew();
    try
    {
        await mongo.Database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: timeout.Token);
        db = "ok";
        dbMs = watch.ElapsedMilliseconds;
    }
    catch (Exception ex) when (ex is OperationCanceledException or TimeoutException or MongoException)
    {
        // Reported as down; never throws out of the health check.
    }
    return Results.Ok(new { status = "ok", version = apiVersion, commit = apiCommit, db, dbMs });
});

app.Run();

// Exposed for integration tests (WebApplicationFactory).
public partial class Program
{
}
