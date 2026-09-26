using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class PasskeyTests
{
    internal static async Task<(AdminSession Session, SoftwareAuthenticator Authenticator)> Registered(ApiFactory factory)
    {
        AdminSession session = await AdminSession.SignedIn(factory);
        SoftwareAuthenticator authenticator = new("dhucar.in", ApiFactory.Origin);
        ApiResult options = await session.Client.Post("PasskeyRegisterOptions", token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, options.Status);
        Assert.Equal("required", options.Data.GetProperty("options").GetProperty("authenticatorSelection").GetProperty("userVerification").GetString());
        ApiResult register = await session.Client.Post("PasskeyRegister", new
        {
            challengeId = options.Data.GetProperty("challengeId").GetString(),
            name = "Test Touch ID",
            credential = authenticator.Create(options.Data.GetProperty("options")),
        }, token: session.AccessToken);
        Assert.True(register.Status == HttpStatusCode.OK, register.Body.ToString());
        return (session, authenticator);
    }

    [Fact]
    public async Task Register_then_sign_in_with_a_passkey_and_no_password()
    {
        using ApiFactory factory = new();
        (AdminSession session, SoftwareAuthenticator authenticator) = await Registered(factory);

        ApiResult list = await session.Client.Post("GetPasskeys", token: session.AccessToken);
        Assert.Equal(1, list.Data.GetArrayLength());
        Assert.Equal("Test Touch ID", list.Data[0].GetProperty("name").GetString());

        HttpClient browser = factory.CreateApiClient();
        ApiResult loginOptions = await browser.Post("PasskeyLoginOptions");
        ApiResult login = await browser.Post("PasskeyLogin", new
        {
            challengeId = loginOptions.Data.GetProperty("challengeId").GetString(),
            credential = authenticator.Get(loginOptions.Data.GetProperty("options")),
        });
        Assert.True(login.Status == HttpStatusCode.OK, login.Body.ToString());
        Assert.Equal(["hwk"], login.Data.GetProperty("authMethods").EnumerateArray().Select(x => x.GetString()));
        ApiResult me = await browser.Post("GetCurrentAdmin", token: login.Data.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.OK, me.Status);
    }

    [Fact]
    public async Task A_forged_signature_or_reused_challenge_is_rejected()
    {
        using ApiFactory factory = new();
        (_, SoftwareAuthenticator authenticator) = await Registered(factory);
        HttpClient browser = factory.CreateApiClient();

        ApiResult options = await browser.Post("PasskeyLoginOptions");
        string challengeId = options.Data.GetProperty("challengeId").GetString()!;
        ApiResult forged = await browser.Post("PasskeyLogin", new { challengeId, credential = authenticator.Get(options.Data.GetProperty("options"), isTampered: true) });
        Assert.Equal(HttpStatusCode.Unauthorized, forged.Status);

        // The challenge was consumed by the failed attempt; a valid response can't reuse it.
        ApiResult reused = await browser.Post("PasskeyLogin", new { challengeId, credential = authenticator.Get(options.Data.GetProperty("options")) });
        Assert.Equal(HttpStatusCode.Unauthorized, reused.Status);
    }

    [Fact]
    public async Task A_passkey_from_another_origin_is_rejected()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        SoftwareAuthenticator authenticator = new("dhucar.in", ApiFactory.Origin);
        ApiResult options = await session.Client.Post("PasskeyRegisterOptions", token: session.AccessToken);
        ApiResult phishing = await session.Client.Post("PasskeyRegister", new
        {
            challengeId = options.Data.GetProperty("challengeId").GetString(),
            name = "Phish",
            credential = authenticator.Create(options.Data.GetProperty("options"), originOverride: "https://dhucar-login.example"),
        }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.BadRequest, phishing.Status);
    }

    [Fact]
    public async Task Registering_needs_a_session_and_deleting_needs_a_fresh_code()
    {
        using ApiFactory factory = new();
        (AdminSession session, SoftwareAuthenticator authenticator) = await Registered(factory);
        HttpClient anonymous = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("PasskeyRegisterOptions")).Status);

        string id = Microsoft.AspNetCore.WebUtilities.WebEncoders.Base64UrlEncode(authenticator.CredentialId);
        ApiResult noCode = await session.Client.Post("DeletePasskey", new { id, code = "000000" }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.Unauthorized, noCode.Status);
        ApiResult deleted = await session.Client.Post("DeletePasskey", new { id, code = session.NextCode() }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, deleted.Status);

        ApiResult options = await anonymous.Post("PasskeyLoginOptions");
        ApiResult login = await anonymous.Post("PasskeyLogin", new { challengeId = options.Data.GetProperty("challengeId").GetString(), credential = authenticator.Get(options.Data.GetProperty("options")) });
        Assert.Equal(HttpStatusCode.Unauthorized, login.Status);
    }

    [Fact]
    public async Task Password_spraying_cannot_lock_the_admin_out_of_passkey_sign_in()
    {
        using ApiFactory factory = new();
        (_, SoftwareAuthenticator authenticator) = await Registered(factory);
        HttpClient attacker = factory.CreateApiClient();
        for (int attempt = 0; attempt < 6; attempt++)
        {
            await attacker.Post("Login", new { email = AdminSession.Email, password = "guess-" + attempt + "-password" });
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, (await attacker.Post("Login", new { email = AdminSession.Email, password = AdminSession.Password })).Status);

        HttpClient owner = factory.CreateApiClient();
        ApiResult options = await owner.Post("PasskeyLoginOptions");
        ApiResult login = await owner.Post("PasskeyLogin", new { challengeId = options.Data.GetProperty("challengeId").GetString(), credential = authenticator.Get(options.Data.GetProperty("options")) });
        Assert.Equal(HttpStatusCode.OK, login.Status);
    }
}
