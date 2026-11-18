namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Where the backup services record their last results.
 */
public class BackupSettings
{
    /// <summary>The folder holding backup.json, backup-good.json and offsite.json (the backup-status volume); empty when not set up.</summary>
    public string StatusDirectory { get; set; } = string.Empty;
}
