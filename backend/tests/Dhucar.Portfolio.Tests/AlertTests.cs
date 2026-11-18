using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>Telegram alerts: a new kind of browser error, and backup problems, each sent once.</summary>
public class AlertTests
{
    private const string Browser = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

    [Fact]
    public async Task A_new_kind_of_browser_error_alerts_once()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        Dictionary<string, string> headers = new() { ["User-Agent"] = Browser };
        object error = new { message = $"TypeError: alert drill {Guid.NewGuid():N}", page = "/about" };

        await client.Post("ReportClientError", error, headers: headers);
        await client.Post("ReportClientError", error, headers: headers);

        // The second report of the same error is counted, not alerted.
        Assert.Single(factory.Alerts.Requests, r => r.Body.Contains("alert+drill", StringComparison.Ordinal) || r.Body.Contains("alert%20drill", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Backup_problems_alert_once_each()
    {
        string folder = Directory.CreateTempSubdirectory("backup-alerts").FullName;
        try
        {
            File.WriteAllText(Path.Combine(folder, "backup.json"), "{\"at\":\"2026-11-18T21:00:05Z\",\"isOk\":false,\"message\":\"The dump failed.\"}");
            File.WriteAllText(Path.Combine(folder, "offsite.json"), "{\"at\":\"2026-11-18T22:00:00Z\",\"isConfigured\":true,\"isOk\":false,\"message\":\"The copy failed.\",\"copies\":3}");
            using ApiFactory factory = new(new() { ["Portfolio:Backups:StatusDirectory"] = folder });
            factory.CreateApiClient();

            using (IServiceScope scope = factory.Services.CreateScope())
            {
                // A failed attempt, no good backup ever, and a failed offsite copy: three alerts.
                Assert.Equal(3, await scope.ServiceProvider.GetRequiredService<BackupAlertBAL>().CheckAndAlert());
                // Checked again: nothing new, nothing sent.
                Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<BackupAlertBAL>().CheckAndAlert());
            }
            Assert.Contains(factory.Alerts.Requests, r => r.Body.Contains("Backup+failed", StringComparison.Ordinal) || r.Body.Contains("Backup%20failed", StringComparison.Ordinal));
        }
        finally
        {
            Directory.Delete(folder, true);
        }
    }

    [Fact]
    public void Healthy_backups_have_no_problems()
    {
        DateTime now = new(2026, 11, 18, 22, 0, 0, DateTimeKind.Utc);
        BackupStatusProblems(new() { IsSetUp = true, LastAttemptAt = now.AddHours(-1), IsLastAttemptOk = true, LastGoodAt = now.AddHours(-1), IsOffsiteConfigured = true, OffsiteAt = now, IsOffsiteOk = true }, now, 0);
        // A good backup, but 40 hours ago: stale.
        BackupStatusProblems(new() { IsSetUp = true, LastAttemptAt = now.AddHours(-40), IsLastAttemptOk = true, LastGoodAt = now.AddHours(-40) }, now, 1);
    }

    private static void BackupStatusProblems(Dhucar.Portfolio.Properties.BackupStatusDTO status, DateTime now, int expected) =>
        Assert.Equal(expected, BackupAlertBAL.Problems(status, now).Count());
}
