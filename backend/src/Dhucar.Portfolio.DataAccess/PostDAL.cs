using MongoDB.Bson;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Paged, searchable admin list and a light picker list
 * Layer           :  DataAccess
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Blog post storage.
 */
public class PostDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPostsDB
    // Method Description    :   Lists posts, newest first.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   isPublishedOnly
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of PostDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostsDB : </c> Lists posts, newest first.
    /// </summary>
    public async Task<List<PostDocument>> GetPostsDB(bool isPublishedOnly)
    {
        FilterDefinition<PostDocument> filter = isPublishedOnly
            ? Builders<PostDocument>.Filter.Eq(x => x.IsPublished, true)
            : FilterDefinition<PostDocument>.Empty;
        return await context.Posts.Find(filter).SortByDescending(x => x.PublishedAt).ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPostDB
    // Method Description    :   Finds a post by slug.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PostDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostDB : </c> Finds a post by slug.
    /// </summary>
    public async Task<PostDocument?> GetPostDB(string slug)
    {
        return await context.Posts.Find(x => x.Id == slug).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertPostDB
    // Method Description    :   Inserts or replaces a post.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   post
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertPostDB : </c> Inserts or replaces a post.
    /// </summary>
    public async Task UpsertPostDB(PostDocument post)
    {
        await context.Posts.ReplaceOneAsync(x => x.Id == post.Id, post, new ReplaceOptions { IsUpsert = true });
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeletePostDB
    // Method Description    :   Deletes a post.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeletePostDB : </c> Deletes a post.
    /// </summary>
    public async Task<bool> DeletePostDB(string slug)
    {
        return (await context.Posts.DeleteOneAsync(x => x.Id == slug)).DeletedCount == 1;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   CountPostsDB
    // Method Description    :   Counts posts.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CountPostsDB : </c> Counts posts.
    /// </summary>
    public async Task<long> CountPostsDB()
    {
        return await context.Posts.CountDocumentsAsync(FilterDefinition<PostDocument>.Empty);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertPostsDB
    // Method Description    :   Bulk-inserts posts (seeding).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   posts
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertPostsDB : </c> Bulk-inserts posts (seeding).
    /// </summary>
    public async Task InsertPostsDB(List<PostDocument> posts)
    {
        if (posts.Count > 0)
        {
            await context.Posts.InsertManyAsync(posts);
        }
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPostPageDB
    // Method Description    :   One page of posts, newest first, without bodies; filters by status and matches text in title, slug, category or tags.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   status, search, skip, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (List of PostDocument, total)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostPageDB : </c> One page of posts, newest first, without bodies; filters by status and matches text in title, slug, category or tags.
    /// </summary>
    public async Task<(List<PostDocument> Items, long Total)> GetPostPageDB(string status, string search, int skip, int limit)
    {
        FilterDefinitionBuilder<PostDocument> builder = Builders<PostDocument>.Filter;
        FilterDefinition<PostDocument> filter = status switch
        {
            "published" => builder.Eq(x => x.IsPublished, true),
            "draft" => builder.Eq(x => x.IsPublished, false),
            _ => builder.Empty,
        };
        if (search.Length > 0)
        {
            BsonRegularExpression pattern = new BsonRegularExpression(Regex.Escape(search), "i");
            filter &= builder.Or(builder.Regex(x => x.Title, pattern), builder.Regex(x => x.Id, pattern), builder.Regex(x => x.Category, pattern), builder.Regex("Tags", pattern));
        }
        long total = await context.Posts.CountDocumentsAsync(filter);
        List<PostDocument> items = await context.Posts.Find(filter)
            .Project<PostDocument>(Builders<PostDocument>.Projection.Exclude(x => x.Content))
            .SortByDescending(x => x.PublishedAt)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
        return (items, total);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetPostOptionsDB
    // Method Description    :   Slug and title of every post, for pickers.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of PostDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostOptionsDB : </c> Slug and title of every post, for pickers.
    /// </summary>
    public async Task<List<PostDocument>> GetPostOptionsDB()
    {
        return await context.Posts.Find(FilterDefinition<PostDocument>.Empty)
            .Project<PostDocument>(Builders<PostDocument>.Projection.Include(x => x.Id).Include(x => x.Title))
            .SortBy(x => x.Title)
            .ToListAsync();
    }
}
