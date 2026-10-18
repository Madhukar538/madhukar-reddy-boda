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
 * Description     :  Reader comments: storage, public listing and moderation.
 */
public class CommentDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertCommentDB
    // Method Description    :   Stores a new comment.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   comment
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertCommentDB : </c> Stores a new comment.
    /// </summary>
    public async Task InsertCommentDB(CommentDocument comment)
    {
        comment.Id = ObjectId.GenerateNewId().ToString();
        await context.Comments.InsertOneAsync(comment);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetApprovedCommentsDB
    // Method Description    :   Approved comments on a post, oldest first, capped.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of CommentDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetApprovedCommentsDB : </c> Approved comments on a post, oldest first, capped.
    /// </summary>
    public async Task<List<CommentDocument>> GetApprovedCommentsDB(string slug, int limit)
    {
        return await context.Comments.Find(x => x.Slug == slug && x.Status == "approved")
            .SortBy(x => x.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetCommentsDB
    // Method Description    :   One page of comments for moderation, newest first; an empty status lists all, and text is matched literally.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   status, search, skip, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of CommentDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetCommentsDB : </c> One page of comments for moderation, newest first; an empty status lists all, and text is matched literally.
    /// </summary>
    public async Task<List<CommentDocument>> GetCommentsDB(string status, string search, int skip, int limit)
    {
        return await context.Comments.Find(ListFilter(status, search)).SortByDescending(x => x.CreatedAt).Skip(skip).Limit(limit).ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetCommentDB
    // Method Description    :   One comment by id, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   id
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   CommentDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetCommentDB : </c> One comment by id, or null.
    /// </summary>
    public async Task<CommentDocument?> GetCommentDB(string id)
    {
        return await context.Comments.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   ApproveCommentDB
    // Method Description    :   Marks a comment approved.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   id
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ApproveCommentDB : </c> Marks a comment approved.
    /// </summary>
    public async Task<bool> ApproveCommentDB(string id)
    {
        UpdateResult result = await context.Comments.UpdateOneAsync(
            x => x.Id == id,
            Builders<CommentDocument>.Update.Set(x => x.Status, "approved").Set(x => x.ApprovedAt, DateTime.UtcNow));
        return result.MatchedCount > 0;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeleteCommentDB
    // Method Description    :   Deletes a comment.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   id
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteCommentDB : </c> Deletes a comment.
    /// </summary>
    public async Task<bool> DeleteCommentDB(string id)
    {
        DeleteResult result = await context.Comments.DeleteOneAsync(x => x.Id == id);
        return result.DeletedCount > 0;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   CountCommentsDB
    // Method Description    :   Comments matching a status and text (empty values match all).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   status, search
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CountCommentsDB : </c> Comments matching a status and text (empty values match all).
    /// </summary>
    public async Task<long> CountCommentsDB(string status, string search)
    {
        return await context.Comments.CountDocumentsAsync(ListFilter(status, search));
    }

    /// <summary>Status (empty for all) and literal text matched in the name, comment or post slug.</summary>
    private static FilterDefinition<CommentDocument> ListFilter(string status, string search)
    {
        FilterDefinitionBuilder<CommentDocument> builder = Builders<CommentDocument>.Filter;
        FilterDefinition<CommentDocument> filter = status.Length == 0 ? builder.Empty : builder.Eq(x => x.Status, status);
        if (search.Length > 0)
        {
            BsonRegularExpression pattern = new BsonRegularExpression(Regex.Escape(search), "i");
            filter &= builder.Or(builder.Regex(x => x.Name, pattern), builder.Regex(x => x.Body, pattern), builder.Regex(x => x.Slug, pattern));
        }
        return filter;
    }
}
