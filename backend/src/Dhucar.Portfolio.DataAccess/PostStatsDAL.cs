using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Per-post reads and reaction counters, changed only by atomic increments so concurrent visitors never overwrite each other.
 */
public class PostStatsDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetStatsDB
    // Method Description    :   Counters for one post, or null before its first read or reaction.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PostStatsDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetStatsDB : </c> Counters for one post, or null before its first read or reaction.
    /// </summary>
    public async Task<PostStatsDocument?> GetStatsDB(string slug)
    {
        return await context.PostStats.Find(x => x.Id == slug).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetTopStatsDB
    // Method Description    :   The most-read posts, highest first.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of PostStatsDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTopStatsDB : </c> The most-read posts, highest first.
    /// </summary>
    public async Task<List<PostStatsDocument>> GetTopStatsDB(int limit)
    {
        return await context.PostStats.Find(FilterDefinition<PostStatsDocument>.Empty)
            .SortByDescending(x => x.Reads)
            .Limit(limit)
            .ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   IncrementReadDB
    // Method Description    :   Adds one read, creating the counters on first use.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>IncrementReadDB : </c> Adds one read, creating the counters on first use.
    /// </summary>
    public async Task IncrementReadDB(string slug)
    {
        await context.PostStats.UpdateOneAsync(
            x => x.Id == slug,
            Builders<PostStatsDocument>.Update.Inc(x => x.Reads, 1).Set(x => x.UpdatedAt, DateTime.UtcNow),
            new UpdateOptions { IsUpsert = true });
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   ChangeReactionDB
    // Method Description    :   Adds or takes back one reaction; a count never drops below zero.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug, reaction, isAdded
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ChangeReactionDB : </c> Adds or takes back one reaction; a count never drops below zero.
    /// </summary>
    public async Task ChangeReactionDB(string slug, string reaction, bool isAdded)
    {
        string field = $"Reactions.{reaction}";
        UpdateDefinition<PostStatsDocument> update = Builders<PostStatsDocument>.Update
            .Inc(field, isAdded ? 1 : -1)
            .Set(x => x.UpdatedAt, DateTime.UtcNow);
        if (isAdded)
        {
            await context.PostStats.UpdateOneAsync(x => x.Id == slug, update, new UpdateOptions { IsUpsert = true });
        }
        else
        {
            await context.PostStats.UpdateOneAsync(Builders<PostStatsDocument>.Filter.And(
                Builders<PostStatsDocument>.Filter.Eq(x => x.Id, slug),
                Builders<PostStatsDocument>.Filter.Gte(field, 1)), update);
        }
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   HasAnyStatsDB
    // Method Description    :   Whether any counters exist yet (used to backfill reads once).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>HasAnyStatsDB : </c> Whether any counters exist yet (used to backfill reads once).
    /// </summary>
    public async Task<bool> HasAnyStatsDB()
    {
        return await context.PostStats.Find(FilterDefinition<PostStatsDocument>.Empty).Limit(1).AnyAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   SetReadsDB
    // Method Description    :   Raises a post's read count to at least a value (one-time backfill from page views).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug, reads
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SetReadsDB : </c> Raises a post's read count to at least a value (one-time backfill from page views).
    /// </summary>
    public async Task SetReadsDB(string slug, long reads)
    {
        await context.PostStats.UpdateOneAsync(
            x => x.Id == slug,
            Builders<PostStatsDocument>.Update.Max(x => x.Reads, reads).Set(x => x.UpdatedAt, DateTime.UtcNow),
            new UpdateOptions { IsUpsert = true });
    }
}
