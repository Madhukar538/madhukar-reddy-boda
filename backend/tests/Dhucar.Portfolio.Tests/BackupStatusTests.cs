using System.Net;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

/// <summary>The admin's backup line: read from the files the backup services write, admin only, missing or broken files tolerated.</summary>
public class BackupStatusTests
{
    [Fact]
    public async Task Without_a_status_folder_it_says_backups_are_not_set_up()
    {
        using ApiFactory factory = new();
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateApiClient().Post("GetBackupStatus")).Status);
        AdminSession session = await AdminSession.SignedIn(factory);
        ApiResult status = await session.Client.Post("GetBackupStatus", token: session.AccessToken);
        Assert.Equal(HttpStatusCode.OK, status.Status);
        Assert.False(status.Data.GetProperty("isSetUp").GetBoolean());
    }

    [Fact]
    public async Task It_reports_the_last_attempt_the_last_good_dump_and_the_offsite_copy()
    {
        string folder = Directory.CreateTempSubdirectory("backup-status").FullName;
        try
        {
            File.WriteAllText(Path.Combine(folder, "backup.json"), "{\"at\":\"2026-11-18T21:00:05Z\",\"isOk\":false,\"message\":\"The dump failed.\"}");
            File.WriteAllText(Path.Combine(folder, "backup-good.json"), "{\"at\":\"2026-11-17T21:00:09.123Z\",\"file\":\"portfolio-2026-11-17T210000Z.gz\",\"bytes\":48213,\"collections\":17,\"documents\":3456}");
            // Half-written or broken: ignored, not an error.
            File.WriteAllText(Path.Combine(folder, "offsite.json"), "{\"at\":");
            using ApiFactory factory = new(new() { ["Portfolio:Backups:StatusDirectory"] = folder });
            AdminSession session = await AdminSession.SignedIn(factory);
            ApiResult result = await session.Client.Post("GetBackupStatus", token: session.AccessToken);
            Assert.Equal(HttpStatusCode.OK, result.Status);
            var data = result.Data;
            Assert.True(data.GetProperty("isSetUp").GetBoolean());
            Assert.False(data.GetProperty("isLastAttemptOk").GetBoolean());
            Assert.Equal("The dump failed.", data.GetProperty("lastAttemptMessage").GetString());
            Assert.Equal(new DateTime(2026, 11, 17, 21, 0, 9, 123, DateTimeKind.Utc), data.GetProperty("lastGoodAt").GetDateTime().ToUniversalTime());
            Assert.Equal("portfolio-2026-11-17T210000Z.gz", data.GetProperty("lastGoodFile").GetString());
            Assert.Equal(48213, data.GetProperty("lastGoodBytes").GetInt64());
            Assert.Equal(17, data.GetProperty("collections").GetInt32());
            Assert.Equal(3456, data.GetProperty("documents").GetInt64());
            Assert.False(data.GetProperty("isOffsiteConfigured").GetBoolean());

            File.WriteAllText(Path.Combine(folder, "offsite.json"), "{\"at\":\"2026-11-18T03:00:00Z\",\"isConfigured\":true,\"isOk\":true,\"message\":\"Copied and verified.\",\"copies\":30}");
            data = (await session.Client.Post("GetBackupStatus", token: session.AccessToken)).Data;
            Assert.True(data.GetProperty("isOffsiteConfigured").GetBoolean());
            Assert.True(data.GetProperty("isOffsiteOk").GetBoolean());
            Assert.Equal(30, data.GetProperty("offsiteCopies").GetInt32());
        }
        finally
        {
            Directory.Delete(folder, true);
        }
    }
}
