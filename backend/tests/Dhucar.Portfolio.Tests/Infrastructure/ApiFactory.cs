using System.Security.Cryptography;
using Dhucar.Portfolio.BusinessLogic.BAL;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Mongo2Go;
using MongoDB.Driver;

namespace Dhucar.Portfolio.Tests.Infrastructure;

/// <summary>The real API in memory, against a real mongod (Mongo2Go) with a fresh database per factory.</summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private static readonly Lazy<MongoDbRunner> Runner = new(() => MongoDbRunner.Start(singleNodeReplSet: false, logger: null));

    public const string SetupToken = "test-setup-token-0123456789-abcdefghijklmnop";
    public const string RevalidateSecret = "test-revalidate-secret-0123456789-abcdefghij";
    public const string Origin = "https://dhucar.in";

    private readonly Dictionary<string, string?> _overrides;

    public ApiFactory(Dictionary<string, string?>? overrides = null)
    {
        _overrides = overrides ?? new Dictionary<string, string?>();
        DatabaseName = "test_" + Guid.NewGuid().ToString("N");
    }

    public string DatabaseName { get; }

    public AdjustableTimeProvider Clock { get; } = new();

    public RecordingHandler Site { get; } = new();

    public IMongoDatabase Database => new MongoClient(Runner.Value.ConnectionString).GetDatabase(DatabaseName);

    public HttpClient CreateApiClient() => CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        HandleCookies = true,
        AllowAutoRedirect = false,
    });

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            Dictionary<string, string?> settings = new()
            {
                ["Portfolio:Mongo:ConnectionString"] = Runner.Value.ConnectionString,
                ["Portfolio:Mongo:Database"] = DatabaseName,
                ["Portfolio:Security:JwtSigningKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
                ["Portfolio:Security:EncryptionKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
                ["Portfolio:Security:SetupToken"] = SetupToken,
                ["Portfolio:Security:AllowedOrigins:0"] = Origin,
                ["Portfolio:Security:IsCookieSecure"] = "true",
                ["Portfolio:Security:AuthRequestsPerMinute"] = "1000",
                ["Portfolio:Passkeys:RpId"] = "dhucar.in",
                ["Portfolio:Passkeys:Origins:0"] = Origin,
                ["Portfolio:Site:RevalidateUrl"] = "https://site.test/api/revalidate",
                ["Portfolio:Site:RevalidateSecret"] = RevalidateSecret,
                ["Portfolio:SeedPath"] = Path.Combine(AppContext.BaseDirectory, "seed", "content.json"),
            };
            foreach (KeyValuePair<string, string?> item in _overrides)
            {
                settings[item.Key] = item.Value;
            }
            config.AddInMemoryCollection(settings);
        });
        builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<TimeProvider>(Clock);
            services.AddHttpClient(RevalidationBAL.HttpClientName).ConfigurePrimaryHttpMessageHandler(() => Site);
        });
    }
}
