using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class AuthFlowTests
{
    [Fact]
    public async Task Setup_requires_the_server_token_a_strong_password_and_happens_once()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();

        ApiResult wrongToken = await client.Post("SetupAdmin", new { setupToken = "nope", email = AdminSession.Email, password = AdminSession.Password });
        Assert.Equal(HttpStatusCode.Forbidden, wrongToken.Status);

        ApiResult weak = await client.Post("SetupAdmin", new { setupToken = ApiFactory.SetupToken, email = AdminSession.Email, password = "short" });
        Assert.Equal(HttpStatusCode.BadRequest, weak.Status);

        AdminSession session = await AdminSession.Enroll(factory);
        Assert.Equal(10, session.RecoveryCodes.Count);

        ApiResult again = await client.Post("SetupAdmin", new { setupToken = ApiFactory.SetupToken, email = "other@dhucar.in", password = AdminSession.Password });
        Assert.Equal(HttpStatusCode.Conflict, again.Status);
    }

    [Fact]
    public async Task Stored_secrets_are_hashed_or_encrypted_never_plain()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        BsonDocument user = await factory.Database.GetCollection<BsonDocument>("adminUsers").Find(FilterDefinition<BsonDocument>.Empty).FirstAsync();
        string json = user.ToJson();
        Assert.DoesNotContain(AdminSession.Password, json);
        Assert.DoesNotContain(session.Secret, json);
        Assert.DoesNotContain(session.RecoveryCodes[0], json);
        Assert.StartsWith("AQAAAA", user["PasswordHash"].AsString); // ASP.NET Identity v3 PBKDF2 format
    }

    [Fact]
    public async Task Password_alone_is_not_enough_and_MFA_issues_tokens()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.Enroll(factory);

        ApiResult wrongPassword = await session.Client.Post("Login", new { email = AdminSession.Email, password = "wrong password here" });
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.Status);
        ApiResult unknownEmail = await session.Client.Post("Login", new { email = "nobody@dhucar.in", password = AdminSession.Password });
        Assert.Equal(wrongPassword.Body.GetProperty("returnMessage").GetString(), unknownEmail.Body.GetProperty("returnMessage").GetString());

        string mfaToken = await session.StartLogin();
        ApiResult mfaAsAccess = await session.Client.Post("GetCurrentAdmin", token: mfaToken);
        Assert.Equal(HttpStatusCode.Unauthorized, mfaAsAccess.Status);

        ApiResult badCode = await session.Client.Post("VerifyMfa", new { mfaToken, code = "000000" });
        Assert.Equal(HttpStatusCode.Unauthorized, badCode.Status);

        ApiResult ok = await session.Client.Post("VerifyMfa", new { mfaToken, code = session.NextCode() });
        Assert.Equal(HttpStatusCode.OK, ok.Status);
        string accessToken = ok.Data.GetProperty("accessToken").GetString()!;
        Assert.Contains("__Host-dhucar_rt=", string.Join(";", ok.Response.Headers.GetValues("Set-Cookie")));
        Assert.Contains("httponly", string.Join(";", ok.Response.Headers.GetValues("Set-Cookie")).ToLowerInvariant());
        Assert.Contains("samesite=strict", string.Join(";", ok.Response.Headers.GetValues("Set-Cookie")).ToLowerInvariant());

        ApiResult me = await session.Client.Post("GetCurrentAdmin", token: accessToken);
        Assert.Equal(HttpStatusCode.OK, me.Status);
        Assert.Equal(AdminSession.Email, me.Data.GetProperty("email").GetString());

        ApiResult reuseMfaToken = await session.Client.Post("VerifyMfa", new { mfaToken, code = session.NextCode() });
        Assert.Equal(HttpStatusCode.Unauthorized, reuseMfaToken.Status);

        ApiResult tampered = await session.Client.Post("GetCurrentAdmin", token: accessToken[..^3] + "abc");
        Assert.Equal(HttpStatusCode.Unauthorized, tampered.Status);
        ApiResult none = await session.Client.Post("GetCurrentAdmin");
        Assert.Equal(HttpStatusCode.Unauthorized, none.Status);
    }

    [Fact]
    public async Task A_TOTP_code_works_only_once()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.Enroll(factory);
        string code = session.NextCode();

        ApiResult first = await session.Client.Post("VerifyMfa", new { mfaToken = await session.StartLogin(), code });
        Assert.Equal(HttpStatusCode.OK, first.Status);
        ApiResult replay = await session.Client.Post("VerifyMfa", new { mfaToken = await session.StartLogin(), code });
        Assert.Equal(HttpStatusCode.Unauthorized, replay.Status);
    }

    [Fact]
    public async Task Repeated_failures_lock_the_account()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.Enroll(factory);
        for (int attempt = 0; attempt < 5; attempt++)
        {
            ApiResult failed = await session.Client.Post("Login", new { email = AdminSession.Email, password = "wrong password here" });
            Assert.Equal(HttpStatusCode.Unauthorized, failed.Status);
        }
        ApiResult locked = await session.Client.Post("Login", new { email = AdminSession.Email, password = AdminSession.Password });
        Assert.Equal(HttpStatusCode.TooManyRequests, locked.Status);
    }

    [Fact]
    public async Task Recovery_codes_work_once_each()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.Enroll(factory);
        string recoveryCode = session.RecoveryCodes[3].ToLowerInvariant().Replace("-", " ");

        ApiResult first = await session.Client.Post("VerifyMfa", new { mfaToken = await session.StartLogin(), recoveryCode });
        Assert.Equal(HttpStatusCode.OK, first.Status);
        Assert.Equal(9, first.Data.GetProperty("recoveryCodesLeft").GetInt32());
        Assert.Contains("rec", first.Data.GetProperty("authMethods").EnumerateArray().Select(x => x.GetString()));

        ApiResult again = await session.Client.Post("VerifyMfa", new { mfaToken = await session.StartLogin(), recoveryCode });
        Assert.Equal(HttpStatusCode.Unauthorized, again.Status);
    }

    [Fact]
    public async Task Refresh_rotates_and_a_reused_token_revokes_the_session()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        Dictionary<string, string> csrf = new() { ["X-Requested-With"] = "dhucar-admin" };

        ApiResult noHeader = await session.Client.Post("RefreshToken");
        Assert.Equal(HttpStatusCode.Forbidden, noHeader.Status);

        ApiResult first = await session.Client.Post("RefreshToken", headers: csrf);
        Assert.Equal(HttpStatusCode.OK, first.Status);
        string firstCookie = first.Response.Headers.GetValues("Set-Cookie").First().Split(';')[0];

        ApiResult second = await session.Client.Post("RefreshToken", headers: csrf);
        Assert.Equal(HttpStatusCode.OK, second.Status);

        // Replay the older, already-rotated cookie from a different client (a stolen copy).
        HttpClient attacker = factory.CreateApiClient();
        ApiResult reuse = await attacker.Post("RefreshToken", headers: new() { ["X-Requested-With"] = "dhucar-admin", ["Cookie"] = firstCookie });
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.Status);

        // The whole session is revoked, including the legitimate latest token.
        ApiResult afterReuse = await session.Client.Post("RefreshToken", headers: csrf);
        Assert.Equal(HttpStatusCode.Unauthorized, afterReuse.Status);
    }

    [Fact]
    public async Task Logout_everywhere_invalidates_existing_access_tokens()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("GetCurrentAdmin", token: session.AccessToken)).Status);

        ApiResult logout = await session.Client.Post("Logout", new { isAllSessions = true }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, logout.Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await session.Client.Post("GetCurrentAdmin", token: session.AccessToken)).Status);
    }

    [Fact]
    public async Task Regenerating_recovery_codes_needs_a_fresh_code()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult denied = await session.Client.Post("RegenerateRecoveryCodes", new { code = "123456" }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.Unauthorized, denied.Status);
        ApiResult ok = await session.Client.Post("RegenerateRecoveryCodes", new { code = session.NextCode() }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, ok.Status);
        Assert.Equal(10, ok.Data.GetProperty("recoveryCodes").GetArrayLength());

        ApiResult oldCode = await session.Client.Post("VerifyMfa", new { mfaToken = await session.StartLogin(), recoveryCode = session.RecoveryCodes[0] });
        Assert.Equal(HttpStatusCode.Unauthorized, oldCode.Status);
    }

    [Fact]
    public async Task Security_events_are_audited()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        await session.Client.Post("Login", new { email = AdminSession.Email, password = "wrong password here" });
        ApiResult log = await session.Client.Post("GetAuditLog", new { limit = 50 }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, log.Status);
        List<string> actions = log.Data.EnumerateArray().Select(x => x.GetProperty("action").GetString()!).ToList();
        Assert.Contains("setup.completed", actions);
        Assert.Contains("login.totp", actions);
        Assert.Contains("login.password-failed", actions);
    }
}
