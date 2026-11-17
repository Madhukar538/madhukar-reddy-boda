using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class ThemeTests
{
    private static string[] Enabled(JsonElement data) =>
        data.GetProperty("themes").EnumerateArray().Where(t => t.GetProperty("isEnabled").GetBoolean()).Select(t => t.GetProperty("id").GetString()!).ToArray();

    [Fact]
    public async Task Before_any_save_every_theme_is_enabled_and_terminal_is_the_default()
    {
        using ApiFactory factory = new();
        JsonElement data = (await factory.CreateApiClient().Post("GetThemes")).Data;
        Assert.Equal("terminal", data.GetProperty("defaultTheme").GetString());
        Assert.Equal(["terminal", "midnight", "blueprint", "editorial", "glass", "arctic", "synthwave", "dune", "gazette", "receipt", "observatory", "bazaar"], Enabled(data));
    }

    [Fact]
    public async Task An_admin_can_disable_themes_and_change_the_default()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult saved = await session.Client.Post("SaveThemes", new { defaultTheme = "midnight", enabledThemes = new[] { "midnight", "terminal" } }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, saved.Status);

        JsonElement data = (await session.Client.Post("GetThemes")).Data;
        Assert.Equal("midnight", data.GetProperty("defaultTheme").GetString());
        // Registry order, whatever order was sent.
        Assert.Equal(["terminal", "midnight"], Enabled(data));
    }

    [Theory]
    [InlineData("glass", new[] { "terminal" })]   // default not enabled
    [InlineData("terminal", new string[0])]       // nothing enabled
    [InlineData("terminal", new[] { "terminal", "neon" })] // unknown theme
    public async Task Invalid_settings_are_rejected(string defaultTheme, string[] enabledThemes)
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult result = await session.Client.Post("SaveThemes", new { defaultTheme, enabledThemes }, token: session.AccessToken);
        Assert.Equal(HttpStatusCode.BadRequest, result.Status);
    }

    [Fact]
    public async Task Saving_themes_needs_a_signed_in_admin()
    {
        using ApiFactory factory = new();
        ApiResult result = await factory.CreateApiClient().Post("SaveThemes", new { defaultTheme = "glass", enabledThemes = new[] { "glass" } });
        Assert.Equal(HttpStatusCode.Unauthorized, result.Status);
    }
}
