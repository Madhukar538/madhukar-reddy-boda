using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Page view storage and analytics aggregations.
 */
public class PageViewDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertPageViewDB
    // Method Description    :   Stores one anonymous page view.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   pageView
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertPageViewDB : </c> Stores one anonymous page view.
    /// </summary>
    public async Task InsertPageViewDB(PageViewDocument pageView)
    {
        pageView.Id = ObjectId.GenerateNewId().ToString();
        await context.PageViews.InsertOneAsync(pageView);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetDailyTrafficDB
    // Method Description    :   Views and unique visitors per day since a date.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   fromDay
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of DailyTrafficDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetDailyTrafficDB : </c> Views and unique visitors per day since a date.
    /// </summary>
    public async Task<List<DailyTrafficDTO>> GetDailyTrafficDB(string fromDay)
    {
        List<BsonDocument> rows = await context.PageViews.Aggregate()
            .Match(Builders<PageViewDocument>.Filter.Gte(x => x.Day, fromDay))
            .Group(new BsonDocument
            {
                { "_id", "$Day" },
                { "views", new BsonDocument("$sum", 1) },
                { "visitors", new BsonDocument("$addToSet", "$VisitorHash") },
            })
            .Sort(new BsonDocument("_id", 1))
            .ToListAsync();
        return rows.Select(x => new DailyTrafficDTO
        {
            Day = x["_id"].AsString,
            PageViews = x["views"].ToInt64(),
            Visitors = x["visitors"].AsBsonArray.Count,
        }).ToList();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetTopValuesDB
    // Method Description    :   Counts views by one field (Path, ReferrerHost, Device, Country) since a date; empty values are skipped.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   fromDay, field, limit
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of CountItemDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTopValuesDB : </c> Counts views by one field (Path, ReferrerHost, Device, Country) since a date; empty values are skipped.
    /// </summary>
    public async Task<List<CountItemDTO>> GetTopValuesDB(string fromDay, string field, int limit)
    {
        string[] allowed = ["Path", "ReferrerHost", "Device", "Country", "UtmSource"];
        if (!allowed.Contains(field))
        {
            throw new ArgumentException("Unsupported field.", nameof(field));
        }
        List<BsonDocument> rows = await context.PageViews.Aggregate()
            .Match(new BsonDocument { { "Day", new BsonDocument("$gte", fromDay) }, { field, new BsonDocument("$nin", new BsonArray { string.Empty, BsonNull.Value }) } })
            .Group(new BsonDocument { { "_id", "$" + field }, { "count", new BsonDocument("$sum", 1) } })
            .Sort(new BsonDocument { { "count", -1 }, { "_id", 1 } })
            .Limit(limit)
            .ToListAsync();
        return rows.Select(x => new CountItemDTO { Key = x["_id"].AsString, Count = x["count"].ToInt64() }).ToList();
    }
}
