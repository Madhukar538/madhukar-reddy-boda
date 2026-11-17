using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Reads, saves and removes the site's story document.
 */
public class StoryDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetStoryDB
    // Method Description    :   The site's story, or null when none is saved.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   StoryDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetStoryDB : </c> The site's story, or null when none is saved.
    /// </summary>
    public async Task<StoryDocument?> GetStoryDB()
    {
        return await context.Stories.Find(x => x.Id == StoryDocument.DocumentId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertStoryDB
    // Method Description    :   Saves the site's story, replacing any earlier one.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   story
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertStoryDB : </c> Saves the site's story, replacing any earlier one.
    /// </summary>
    public async Task UpsertStoryDB(StoryDocument story)
    {
        story.Id = StoryDocument.DocumentId;
        await context.Stories.ReplaceOneAsync(x => x.Id == StoryDocument.DocumentId, story, new ReplaceOptions { IsUpsert = true });
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeleteStoryDB
    // Method Description    :   Removes the saved story (the site goes back to its built-in one).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteStoryDB : </c> Removes the saved story (the site goes back to its built-in one).
    /// </summary>
    public async Task DeleteStoryDB()
    {
        await context.Stories.DeleteOneAsync(x => x.Id == StoryDocument.DocumentId);
    }
}
