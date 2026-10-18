using System.Text.RegularExpressions;
using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Uploaded images: storage by content hash, listing without the bytes, and serving.
 */
public class MediaDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertMediaDB
    // Method Description    :   Stores an image; returns false when the same image (same hash) is already stored.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   media
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertMediaDB : </c> Stores an image; returns false when the same image (same hash) is already stored.
    /// </summary>
    public async Task<bool> InsertMediaDB(MediaDocument media)
    {
        try
        {
            await context.Media.InsertOneAsync(media);
            return true;
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return false;
        }
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetMediaPageDB
    // Method Description    :   One page of images, newest first, without their bytes; text is matched literally in the file name.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   search, skip, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (List of MediaDocument, total)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetMediaPageDB : </c> One page of images, newest first, without their bytes; text is matched literally in the file name.
    /// </summary>
    public async Task<(List<MediaDocument> Items, long Total)> GetMediaPageDB(string search, int skip, int limit)
    {
        FilterDefinitionBuilder<MediaDocument> builder = Builders<MediaDocument>.Filter;
        FilterDefinition<MediaDocument> filter = search.Length > 0 ? builder.Regex(x => x.Name, new BsonRegularExpression(Regex.Escape(search), "i")) : builder.Empty;
        long total = await context.Media.CountDocumentsAsync(filter);
        List<MediaDocument> items = await context.Media.Find(filter)
            .Project<MediaDocument>(Builders<MediaDocument>.Projection.Exclude(x => x.Data))
            .SortByDescending(x => x.UploadedAt)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
        return (items, total);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetMediaDB
    // Method Description    :   One image with its bytes, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   mediaId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   MediaDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetMediaDB : </c> One image with its bytes, or null.
    /// </summary>
    public async Task<MediaDocument?> GetMediaDB(string mediaId)
    {
        return await context.Media.Find(x => x.Id == mediaId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetMediaInfoDB
    // Method Description    :   One image without its bytes, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   mediaId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   MediaDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetMediaInfoDB : </c> One image without its bytes, or null.
    /// </summary>
    public async Task<MediaDocument?> GetMediaInfoDB(string mediaId)
    {
        return await context.Media.Find(x => x.Id == mediaId).Project<MediaDocument>(Builders<MediaDocument>.Projection.Exclude(x => x.Data)).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeleteMediaDB
    // Method Description    :   Deletes an image.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   mediaId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteMediaDB : </c> Deletes an image.
    /// </summary>
    public async Task<bool> DeleteMediaDB(string mediaId)
    {
        DeleteResult result = await context.Media.DeleteOneAsync(x => x.Id == mediaId);
        return result.DeletedCount > 0;
    }
}
