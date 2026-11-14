using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Reads and saves the theme settings document.
 */
public class ThemeDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetThemeSettingsDB
    // Method Description    :   Returns the theme settings, or null if they were never saved.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   14 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   ThemeSettingsDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    14 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetThemeSettingsDB : </c> Returns the theme settings, or null if they were never saved.
    /// </summary>
    public async Task<ThemeSettingsDocument?> GetThemeSettingsDB()
    {
        return await context.Themes.Find(x => x.Id == ThemeSettingsDocument.DocumentId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertThemeSettingsDB
    // Method Description    :   Replaces the theme settings, creating them on first save.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   14 Nov 2026
    // Input Parameters      :   settings
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    14 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertThemeSettingsDB : </c> Replaces the theme settings, creating them on first save.
    /// </summary>
    public async Task UpsertThemeSettingsDB(ThemeSettingsDocument settings)
    {
        settings.Id = ThemeSettingsDocument.DocumentId;
        await context.Themes.ReplaceOneAsync(x => x.Id == ThemeSettingsDocument.DocumentId, settings, new ReplaceOptions { IsUpsert = true });
    }
}
