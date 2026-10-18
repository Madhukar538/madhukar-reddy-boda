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
 * Description     :  Support tickets: storage, paged listing, updates and dashboard counts.
 */
public class TicketDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertTicketDB
    // Method Description    :   Stores a new ticket; returns false when the id already exists (a retried submission).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   ticket
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertTicketDB : </c> Stores a new ticket; returns false when the id already exists (a retried submission).
    /// </summary>
    public async Task<bool> InsertTicketDB(TicketDocument ticket)
    {
        try
        {
            await context.Tickets.InsertOneAsync(ticket);
            return true;
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return false;
        }
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetTicketPageDB
    // Method Description    :   One page of tickets, newest first, filtered by statuses and priority; text is matched literally in id, title, name, contact or description.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   statuses, priority, search, skip, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (List of TicketDocument, total)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTicketPageDB : </c> One page of tickets, newest first, filtered by statuses and priority; text is matched literally in id, title, name, contact or description.
    /// </summary>
    public async Task<(List<TicketDocument> Items, long Total)> GetTicketPageDB(string[] statuses, string priority, string search, int skip, int limit)
    {
        FilterDefinitionBuilder<TicketDocument> builder = Builders<TicketDocument>.Filter;
        FilterDefinition<TicketDocument> filter = statuses.Length > 0 ? builder.In(x => x.Status, statuses) : builder.Empty;
        if (priority.Length > 0)
        {
            filter &= builder.Eq(x => x.Priority, priority);
        }
        if (search.Length > 0)
        {
            BsonRegularExpression pattern = new BsonRegularExpression(Regex.Escape(search), "i");
            filter &= builder.Or(builder.Regex(x => x.Id, pattern), builder.Regex(x => x.Title, pattern), builder.Regex(x => x.Name, pattern), builder.Regex(x => x.Contact, pattern), builder.Regex(x => x.Description, pattern));
        }
        long total = await context.Tickets.CountDocumentsAsync(filter);
        List<TicketDocument> items = await context.Tickets.Find(filter).SortByDescending(x => x.CreatedAt).Skip(skip).Limit(limit).ToListAsync();
        return (items, total);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetTicketDB
    // Method Description    :   One ticket by id, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   ticketId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   TicketDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTicketDB : </c> One ticket by id, or null.
    /// </summary>
    public async Task<TicketDocument?> GetTicketDB(string ticketId)
    {
        return await context.Tickets.Find(x => x.Id == ticketId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpdateTicketDB
    // Method Description    :   Applies status, priority and resolution time changes and appends notes in one atomic update.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   ticketId, status, priority, resolvedAt, notes
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpdateTicketDB : </c> Applies status, priority and resolution time changes and appends notes in one atomic update.
    /// </summary>
    public async Task<bool> UpdateTicketDB(string ticketId, string status, string priority, DateTime? resolvedAt, List<TicketNoteItem> notes)
    {
        UpdateDefinitionBuilder<TicketDocument> builder = Builders<TicketDocument>.Update;
        List<UpdateDefinition<TicketDocument>> updates = [builder.Set(x => x.UpdatedAt, DateTime.UtcNow)];
        if (status.Length > 0)
        {
            updates.Add(builder.Set(x => x.Status, status));
        }
        if (priority.Length > 0)
        {
            updates.Add(builder.Set(x => x.Priority, priority));
        }
        if (resolvedAt != null)
        {
            updates.Add(builder.Set(x => x.ResolvedAt, resolvedAt));
        }
        if (notes.Count > 0)
        {
            updates.Add(builder.PushEach(x => x.Notes, notes));
        }
        UpdateResult result = await context.Tickets.UpdateOneAsync(x => x.Id == ticketId, builder.Combine(updates));
        return result.MatchedCount > 0;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   CountByFieldDB
    // Method Description    :   Ticket counts grouped by Status or Priority, optionally limited to some statuses.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   field, statuses
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Dictionary of counts
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CountByFieldDB : </c> Ticket counts grouped by Status or Priority, optionally limited to some statuses.
    /// </summary>
    public async Task<Dictionary<string, long>> CountByFieldDB(string field, string[] statuses)
    {
        if (field is not ("Status" or "Priority"))
        {
            throw new ArgumentException("Unsupported field.", nameof(field));
        }
        BsonDocument match = statuses.Length > 0 ? new BsonDocument("Status", new BsonDocument("$in", new BsonArray(statuses))) : new BsonDocument();
        List<BsonDocument> rows = await context.Tickets.Aggregate()
            .Match(match)
            .Group(new BsonDocument { { "_id", "$" + field }, { "count", new BsonDocument("$sum", 1) } })
            .ToListAsync();
        return rows.Where(x => x["_id"].IsString).ToDictionary(x => x["_id"].AsString, x => x["count"].ToInt64());
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   CountCreatedSinceDB
    // Method Description    :   Tickets filed since a time.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   since
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CountCreatedSinceDB : </c> Tickets filed since a time.
    /// </summary>
    public async Task<long> CountCreatedSinceDB(DateTime since)
    {
        return await context.Tickets.CountDocumentsAsync(x => x.CreatedAt >= since);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetResolutionHoursDB
    // Method Description    :   Hours from filing to resolution for tickets resolved since a time.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   since
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of double
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetResolutionHoursDB : </c> Hours from filing to resolution for tickets resolved since a time.
    /// </summary>
    public async Task<List<double>> GetResolutionHoursDB(DateTime since)
    {
        List<TicketDocument> resolved = await context.Tickets.Find(x => x.ResolvedAt != null && x.ResolvedAt >= since)
            .Project<TicketDocument>(Builders<TicketDocument>.Projection.Include(x => x.CreatedAt).Include(x => x.ResolvedAt))
            .Limit(5000)
            .ToListAsync();
        return resolved.Select(x => (x.ResolvedAt!.Value - x.CreatedAt).TotalHours).ToList();
    }
}
