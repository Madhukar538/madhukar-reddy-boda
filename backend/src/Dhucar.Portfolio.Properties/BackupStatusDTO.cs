namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  How the backups stand: the last attempt, the last dump that restored cleanly, and the offsite copy.
 */
public class BackupStatusDTO
{
    /// <summary>False when the API has no backup status folder (not deployed with the backup services).</summary>
    public bool IsSetUp { get; set; }

    /// <summary>UTC time of the last backup attempt, or null if none is recorded.</summary>
    public DateTime? LastAttemptAt { get; set; }

    /// <summary>Whether the last attempt dumped and restore-checked cleanly.</summary>
    public bool IsLastAttemptOk { get; set; }

    /// <summary>What the last attempt reported.</summary>
    public string LastAttemptMessage { get; set; } = string.Empty;

    /// <summary>UTC time the last good dump was restore-checked, or null if none has been.</summary>
    public DateTime? LastGoodAt { get; set; }

    /// <summary>The last good dump's file name.</summary>
    public string LastGoodFile { get; set; } = string.Empty;

    /// <summary>The last good dump's size in bytes.</summary>
    public long LastGoodBytes { get; set; }

    /// <summary>Collections that came back in the restore check.</summary>
    public int Collections { get; set; }

    /// <summary>Documents that came back in the restore check.</summary>
    public long Documents { get; set; }

    /// <summary>Whether offsite copies are set up (the OFFSITE_* settings).</summary>
    public bool IsOffsiteConfigured { get; set; }

    /// <summary>UTC time of the last offsite run, or null if none is recorded.</summary>
    public DateTime? OffsiteAt { get; set; }

    /// <summary>Whether the last offsite run copied and verified every dump.</summary>
    public bool IsOffsiteOk { get; set; }

    /// <summary>What the last offsite run reported.</summary>
    public string OffsiteMessage { get; set; } = string.Empty;

    /// <summary>Dumps held in the offsite bucket.</summary>
    public int OffsiteCopies { get; set; }
}
