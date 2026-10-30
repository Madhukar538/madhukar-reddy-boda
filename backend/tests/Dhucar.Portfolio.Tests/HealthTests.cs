using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class HealthTests
{
    [Fact]
    public async Task Health_reports_the_release_and_the_database()
    {
        using ApiFactory factory = new();
        HttpResponseMessage response = await factory.CreateApiClient().GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        JsonElement body = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("ok", body.GetProperty("status").GetString());
        Assert.Matches(@"^\d+\.\d+\.\d+$", body.GetProperty("version").GetString());
        Assert.Equal("ok", body.GetProperty("db").GetString());
        Assert.True(body.GetProperty("dbMs").GetInt64() >= 0);
    }
}
