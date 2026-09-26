using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>The owner's database switch settings/security.IsPasswordLoginEnabled, flipped exactly as in Atlas.</summary>
public class PasskeyOnlyTests
{
    private static async Task SetPasswordLogin(ApiFactory factory, bool isEnabled)
    {
        UpdateResult result = await factory.Database.GetCollection<BsonDocument>("settings").UpdateOneAsync(
            new BsonDocument("_id", "security"),
            new BsonDocument("$set", new BsonDocument("IsPasswordLoginEnabled", isEnabled)));
        Assert.Equal(1, result.MatchedCount);
    }

    private static async Task<bool> SignInPageOffersPassword(HttpClient client)
    {
        ApiResult options = await client.Post("GetSignInOptions");
        Assert.Equal(HttpStatusCode.OK, options.Status);
        return options.Data.GetProperty("isPasswordLoginEnabled").GetBoolean();
    }

    [Fact]
    public async Task The_switch_is_created_on_start_and_defaults_to_on()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        BsonDocument settings = await factory.Database.GetCollection<BsonDocument>("settings")
            .Find(new BsonDocument("_id", "security")).FirstAsync();
        Assert.True(settings["IsPasswordLoginEnabled"].AsBoolean);
        Assert.True(await SignInPageOffersPassword(client));
    }

    [Fact]
    public async Task The_setup_link_is_offered_only_until_the_admin_exists()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        Assert.True((await client.Post("GetSignInOptions")).Data.GetProperty("isSetupAvailable").GetBoolean());

        await AdminSession.Enroll(factory);
        Assert.False((await client.Post("GetSignInOptions")).Data.GetProperty("isSetupAvailable").GetBoolean());

        using ApiFactory withoutToken = new(new() { ["Portfolio:Security:SetupToken"] = string.Empty });
        Assert.False((await withoutToken.CreateApiClient().Post("GetSignInOptions")).Data.GetProperty("isSetupAvailable").GetBoolean());
    }

    [Fact]
    public async Task Turned_off_with_a_passkey_only_the_passkey_signs_in()
    {
        using ApiFactory factory = new();
        (AdminSession session, SoftwareAuthenticator authenticator) = await PasskeyTests.Registered(factory);
        await SetPasswordLogin(factory, false);

        HttpClient browser = factory.CreateApiClient();
        Assert.False(await SignInPageOffersPassword(browser));

        // The right password is refused, with a message that doesn't depend on the email.
        ApiResult login = await browser.Post("Login", new { email = AdminSession.Email, password = AdminSession.Password });
        Assert.Equal(HttpStatusCode.Forbidden, login.Status);
        ApiResult unknown = await browser.Post("Login", new { email = "nobody@example.com", password = "whatever-password" });
        Assert.Equal(login.Body.GetProperty("returnMessage").GetString(), unknown.Body.GetProperty("returnMessage").GetString());

        // The passkey still works.
        ApiResult loginOptions = await browser.Post("PasskeyLoginOptions");
        ApiResult passkey = await browser.Post("PasskeyLogin", new
        {
            challengeId = loginOptions.Data.GetProperty("challengeId").GetString(),
            credential = authenticator.Get(loginOptions.Data.GetProperty("options")),
        });
        Assert.True(passkey.Status == HttpStatusCode.OK, passkey.Body.ToString());

        ApiResult me = await browser.Post("GetCurrentAdmin", token: passkey.Data.GetProperty("accessToken").GetString());
        Assert.False(me.Data.GetProperty("isPasswordLoginEnabled").GetBoolean());
        Assert.False(me.Data.GetProperty("isPasswordLoginAllowed").GetBoolean());

        // Turning it back on applies at once, with no restart.
        await SetPasswordLogin(factory, true);
        Assert.True(await SignInPageOffersPassword(browser));
        await session.SignIn();
    }

    [Fact]
    public async Task A_sign_in_started_before_the_switch_went_off_cannot_finish()
    {
        using ApiFactory factory = new();
        (AdminSession session, _) = await PasskeyTests.Registered(factory);
        string mfaToken = await session.StartLogin();
        await SetPasswordLogin(factory, false);

        ApiResult verify = await session.Client.Post("VerifyMfa", new { mfaToken, code = session.NextCode() });
        Assert.Equal(HttpStatusCode.Forbidden, verify.Status);
        ApiResult recovery = await session.Client.Post("VerifyMfa", new { mfaToken, recoveryCode = session.RecoveryCodes[0] });
        Assert.Equal(HttpStatusCode.Forbidden, recovery.Status);
    }

    [Fact]
    public async Task With_no_passkey_the_switch_is_ignored_so_the_admin_is_never_locked_out()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        await SetPasswordLogin(factory, false);

        Assert.True(await SignInPageOffersPassword(factory.CreateApiClient()));
        await session.SignIn();
        ApiResult me = await session.Client.Post("GetCurrentAdmin", token: session.AccessToken);
        Assert.False(me.Data.GetProperty("isPasswordLoginEnabled").GetBoolean());
        Assert.True(me.Data.GetProperty("isPasswordLoginAllowed").GetBoolean());
    }
}
