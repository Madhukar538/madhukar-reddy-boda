using System.Globalization;
using System.Text.Json;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Tenancy;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  The backups' standing for the admin, from what the backup and offsite services last recorded.
 */
public class BackupBAL(BackupStatusDAL backupStatusDAL, ICodeLogger codeLog)
{
    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetBackupStatus
    // Method Description    :   The last backup attempt, the last dump that restored cleanly and the last offsite copy.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetBackupStatus : </c> The last backup attempt, the last dump that restored cleanly and the last offsite copy.
    /// </summary>
    public async Task<Response<object>> GetBackupStatus()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            // The backups cover this site's own database: other sites' admins aren't shown them.
            BackupStatusDTO status = new() { IsSetUp = TenantScope.IsPrimary && backupStatusDAL.IsSetUpDB() };
            if (status.IsSetUp)
            {
                JsonElement? attempt = await backupStatusDAL.ReadStatusDB("backup.json");
                JsonElement? good = await backupStatusDAL.ReadStatusDB("backup-good.json");
                JsonElement? offsite = await backupStatusDAL.ReadStatusDB("offsite.json");
                if (attempt is JsonElement a)
                {
                    status.LastAttemptAt = Time(a, "at");
                    status.IsLastAttemptOk = Bool(a, "isOk");
                    status.LastAttemptMessage = Text(a, "message");
                }
                if (good is JsonElement g)
                {
                    status.LastGoodAt = Time(g, "at");
                    status.LastGoodFile = Text(g, "file");
                    status.LastGoodBytes = (long)Number(g, "bytes");
                    status.Collections = (int)Number(g, "collections");
                    status.Documents = (long)Number(g, "documents");
                }
                if (offsite is JsonElement o)
                {
                    status.IsOffsiteConfigured = Bool(o, "isConfigured");
                    status.OffsiteAt = Time(o, "at");
                    status.IsOffsiteOk = Bool(o, "isOk");
                    status.OffsiteMessage = Text(o, "message");
                    status.OffsiteCopies = (int)Number(o, "copies");
                }
            }
            objResponse.Data = status;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Backup status.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetBackupStatus", string.Empty, nameof(GetBackupStatus));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private static string Text(JsonElement element, string name)
    {
        string value = element.TryGetProperty(name, out JsonElement x) && x.ValueKind == JsonValueKind.String ? x.GetString() ?? string.Empty : string.Empty;
        return value.Length > 200 ? value[..200] : value;
    }

    private static bool Bool(JsonElement element, string name) =>
        element.TryGetProperty(name, out JsonElement x) && x.ValueKind == JsonValueKind.True;

    private static double Number(JsonElement element, string name) =>
        element.TryGetProperty(name, out JsonElement x) && x.ValueKind == JsonValueKind.Number && x.TryGetDouble(out double value) && value >= 0 && value < 1e15 ? value : 0;

    private static DateTime? Time(JsonElement element, string name) =>
        DateTime.TryParse(Text(element, name), CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out DateTime value) ? value : null;
}
