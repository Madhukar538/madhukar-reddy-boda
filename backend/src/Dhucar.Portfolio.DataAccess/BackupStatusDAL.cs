using System.Text.Json;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Reads the small JSON files the backup services leave in the backup status folder.
 */
public class BackupStatusDAL(IOptions<PortfolioSettings> options)
{
    /// <summary>Files read: the status names the services write, nothing else.</summary>
    private static readonly string[] _knownFiles = ["backup.json", "backup-good.json", "offsite.json"];

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   IsSetUpDB
    // Method Description    :   Whether the backup status folder is configured and exists.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>IsSetUpDB : </c> Whether the backup status folder is configured and exists.
    /// </summary>
    public bool IsSetUpDB()
    {
        string directory = options.Value.Backups.StatusDirectory;
        return directory.Length > 0 && Directory.Exists(directory);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   ReadStatusDB
    // Method Description    :   One status file's JSON, or null when it is missing or unreadable.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   fileName
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   JsonElement?
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ReadStatusDB : </c> One status file's JSON, or null when it is missing or unreadable.
    /// </summary>
    public async Task<JsonElement?> ReadStatusDB(string fileName)
    {
        if (!_knownFiles.Contains(fileName) || !IsSetUpDB())
        {
            return null;
        }
        string path = Path.Combine(options.Value.Backups.StatusDirectory, fileName);
        if (!File.Exists(path))
        {
            return null;
        }
        try
        {
            await using FileStream stream = File.OpenRead(path);
            using JsonDocument document = await JsonDocument.ParseAsync(stream);
            return document.RootElement.ValueKind == JsonValueKind.Object ? document.RootElement.Clone() : null;
        }
        catch (Exception ex) when (ex is JsonException or IOException)
        {
            return null;
        }
    }
}
