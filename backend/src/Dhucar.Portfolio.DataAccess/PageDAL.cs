using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Reads and saves the pages made in the admin.
 */
public class PageDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPagesDB
    // Method Description    :   The pages, by title, without their content; only published ones unless asked for all.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   isPublishedOnly
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of PageDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPagesDB : </c> The pages, by title, without their content; only published ones unless asked for all.
    /// </summary>
    public async Task<List<PageDocument>> GetPagesDB(bool isPublishedOnly)
    {
        FilterDefinition<PageDocument> filter = isPublishedOnly
            ? Builders<PageDocument>.Filter.Eq(x => x.IsPublished, true)
            : FilterDefinition<PageDocument>.Empty;
        return await context.Pages.Find(filter)
            .Project<PageDocument>(Builders<PageDocument>.Projection.Exclude(x => x.Content))
            .SortBy(x => x.Title)
            .ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPageDB
    // Method Description    :   One page with its content, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PageDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPageDB : </c> One page with its content, or null.
    /// </summary>
    public async Task<PageDocument?> GetPageDB(string slug)
    {
        return await context.Pages.Find(x => x.Id == slug).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertPageDB
    // Method Description    :   Saves a page at its slug, replacing what was there.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   page
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertPageDB : </c> Saves a page at its slug, replacing what was there.
    /// </summary>
    public async Task UpsertPageDB(PageDocument page)
    {
        await context.Pages.ReplaceOneAsync(x => x.Id == page.Id, page, new ReplaceOptions { IsUpsert = true });
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeletePageDB
    // Method Description    :   Deletes a page; true if there was one.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeletePageDB : </c> Deletes a page; true if there was one.
    /// </summary>
    public async Task<bool> DeletePageDB(string slug)
    {
        DeleteResult result = await context.Pages.DeleteOneAsync(x => x.Id == slug);
        return result.DeletedCount > 0;
    }
}
