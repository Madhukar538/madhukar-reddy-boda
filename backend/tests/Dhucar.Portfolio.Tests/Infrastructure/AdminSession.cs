using System.Net;
using Dhucar.Portfolio.Common.Security;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Dhucar.Portfolio.Tests.Infrastructure;

/// <summary>Runs the real setup, TOTP enrolment and two-step sign-in, and keeps what later calls need.</summary>
public sealed class AdminSession
{
    public const string Email = "admin@dhucar.in";
    public const string Password = "correct horse battery staple 42";

    private AdminSession(ApiFactory factory, HttpClient client, string secret)
    {
        Factory = factory;
        Client = client;
        Secret = secret;
    }

    public ApiFactory Factory { get; }

    public HttpClient Client { get; }

    public string Secret { get; }

    public List<string> RecoveryCodes { get; private set; } = new();

    public string AccessToken { get; private set; } = string.Empty;

    /// <summary>Moves the clock to a fresh 30-second step and returns that step's code (each code works once).</summary>
    public string NextCode()
    {
        Factory.Clock.Advance(TimeSpan.FromSeconds(30));
        TotpService totp = Factory.Services.GetRequiredService<TotpService>();
        return totp.ComputeCode(Secret, totp.CurrentStep());
    }

    public static async Task<AdminSession> Enroll(ApiFactory factory)
    {
        HttpClient client = factory.CreateApiClient();
        ApiResult setup = await client.Post("SetupAdmin", new { setupToken = ApiFactory.SetupToken, email = Email, password = Password });
        Assert.Equal(HttpStatusCode.OK, setup.Status);
        AdminSession session = new(factory, client, setup.Data.GetProperty("totpSecret").GetString()!);
        ApiResult confirm = await client.Post("ConfirmTotpSetup", new { enrollmentToken = setup.Data.GetProperty("enrollmentToken").GetString(), code = session.NextCode() });
        Assert.Equal(HttpStatusCode.OK, confirm.Status);
        session.RecoveryCodes = confirm.Data.GetProperty("recoveryCodes").EnumerateArray().Select(x => x.GetString()!).ToList();
        return session;
    }

    public static async Task<AdminSession> SignedIn(ApiFactory factory)
    {
        AdminSession session = await Enroll(factory);
        await session.SignIn();
        return session;
    }

    public async Task<string> StartLogin()
    {
        ApiResult login = await Client.Post("Login", new { email = Email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.Status);
        return login.Data.GetProperty("mfaToken").GetString()!;
    }

    public async Task SignIn()
    {
        string mfaToken = await StartLogin();
        ApiResult verify = await Client.Post("VerifyMfa", new { mfaToken, code = NextCode() });
        Assert.Equal(HttpStatusCode.OK, verify.Status);
        AccessToken = verify.Data.GetProperty("accessToken").GetString()!;
    }
}
