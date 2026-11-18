using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Properties;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Telegram alerts when the backups go wrong: a failed backup or restore check, no good backup for
 *                    over 36 hours, or a failed or unverified offsite copy. Each problem is sent once (until it
 *                    changes), so a backup that stays broken doesn't alert every half hour.
 */
public class BackupAlertBAL(BackupBAL backupBAL, NotificationBAL notificationBAL, TimeProvider timeProvider, ICodeLogger codeLog)
{
    /// <summary>A nightly backup older than this means a night was missed.</summary>
    public static readonly TimeSpan StaleAfter = TimeSpan.FromHours(36);

    /// <summary>Problems already alerted about, by a key naming the problem and when it was recorded.</summary>
    private static readonly HashSet<string> _alerted = new();
    private static readonly object _lock = new();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   CheckAndAlert
    // Method Description    :   Reads the backup status and sends one alert for each problem not alerted about yet.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   int (alerts sent)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CheckAndAlert : </c> Reads the backup status and sends one alert for each problem not alerted about yet.
    /// </summary>
    public async Task<int> CheckAndAlert()
    {
        int sent = 0;
        try
        {
            Response<object> response = await backupBAL.GetBackupStatus();
            if (response.Data is not BackupStatusDTO status || !status.IsSetUp)
            {
                return 0;
            }
            foreach ((string key, string message) in Problems(status, timeProvider.GetUtcNow().UtcDateTime))
            {
                bool isNew;
                lock (_lock)
                {
                    isNew = _alerted.Add(key);
                }
                if (isNew && await notificationBAL.SendAlert(message))
                {
                    sent++;
                }
            }
        }
        catch (Exception ex)
        {
            codeLog.Error(ex, "Step CheckAndAlert", string.Empty, nameof(CheckAndAlert));
        }
        return sent;
    }

    /// <summary>Each current problem, as a key (what and when, so it alerts once) and the message to send.</summary>
    public static IEnumerable<(string Key, string Message)> Problems(BackupStatusDTO status, DateTime now)
    {
        if (status.LastAttemptAt is DateTime attemptAt && !status.IsLastAttemptOk)
        {
            yield return ($"attempt:{attemptAt:O}", $"🔴 <b>Backup failed</b>\n{NotificationBAL.Escape(status.LastAttemptMessage)}\nCheck the mongo-backup service in Coolify.");
        }
        DateTime? lastGood = status.LastGoodAt;
        if (status.LastAttemptAt != null && (lastGood == null || now - lastGood.Value > StaleAfter))
        {
            string age = lastGood == null ? "No backup has passed its restore check yet." : $"The last good one is from {lastGood.Value:dd MMM yyyy, HH:mm} UTC.";
            yield return ($"stale:{lastGood?.ToString("O") ?? "never"}", $"🟠 <b>No good backup in over {StaleAfter.TotalHours:0} hours</b>\n{age}");
        }
        if (status.IsOffsiteConfigured && status.OffsiteAt is DateTime offsiteAt && !status.IsOffsiteOk)
        {
            yield return ($"offsite:{offsiteAt:O}", $"🟠 <b>Offsite backup copy failed</b>\n{NotificationBAL.Escape(status.OffsiteMessage)}\nCheck the mongo-offsite service in Coolify.");
        }
    }
}
