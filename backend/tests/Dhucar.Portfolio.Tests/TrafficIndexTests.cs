using Dhucar.Portfolio.Tests.Infrastructure;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class TrafficIndexTests
{
    /// <summary>The query plan MongoDB would use for an aggregation on pageViews.</summary>
    private static async Task<string> Plan(IMongoDatabase database, params BsonDocument[] pipeline)
    {
        BsonDocument command = new()
        {
            { "explain", new BsonDocument { { "aggregate", "pageViews" }, { "pipeline", new BsonArray(pipeline) }, { "cursor", new BsonDocument() } } },
            { "verbosity", "queryPlanner" },
        };
        return (await database.RunCommandAsync<BsonDocument>(command)).ToJson();
    }

    [Fact]
    public async Task Traffic_reports_and_read_backfill_use_indexes_not_collection_scans()
    {
        using ApiFactory factory = new();
        // Starting the API creates the indexes.
        factory.CreateApiClient();
        IMongoDatabase database = factory.Database;
        IMongoCollection<BsonDocument> views = database.GetCollection<BsonDocument>("pageViews");
        string[] days = ["2026-10-16", "2026-10-17", "2026-10-18"];
        await views.InsertManyAsync(Enumerable.Range(0, 300).Select(i => new BsonDocument
        {
            { "_id", ObjectId.GenerateNewId().ToString() },
            { "Timestamp", DateTime.UtcNow },
            { "Day", days[i % 3] },
            { "Path", i % 2 == 0 ? $"/blog/post-{i % 7}" : "/about" },
            { "ReferrerHost", i % 5 == 0 ? "google.com" : string.Empty },
            { "UtmSource", string.Empty },
            { "Device", i % 3 == 0 ? "mobile" : "desktop" },
            { "Country", "IN" },
            { "VisitorHash", $"v{i % 40}" },
        }));

        BsonDocument fromDay = new("$match", new BsonDocument("Day", new BsonDocument("$gte", "2026-10-17")));
        string daily = await Plan(database, fromDay,
            new BsonDocument("$group", new BsonDocument { { "_id", "$Day" }, { "views", new BsonDocument("$sum", 1) }, { "visitors", new BsonDocument("$addToSet", "$VisitorHash") } }));
        Assert.DoesNotContain("COLLSCAN", daily);

        foreach (string field in new[] { "Path", "ReferrerHost", "Device", "Country", "UtmSource" })
        {
            string top = await Plan(database,
                new BsonDocument("$match", new BsonDocument { { "Day", new BsonDocument("$gte", "2026-10-17") }, { field, new BsonDocument("$nin", new BsonArray { string.Empty, BsonNull.Value }) } }),
                new BsonDocument("$group", new BsonDocument { { "_id", "$" + field }, { "count", new BsonDocument("$sum", 1) } }));
            Assert.DoesNotContain("COLLSCAN", top);
            // Answered from the index on (Day, field) alone.
            Assert.Contains("Day_1_" + field + "_1", top);
        }

        string backfill = await Plan(database,
            new BsonDocument("$match", new BsonDocument("Path", new BsonRegularExpression("^/blog/[^/]+$"))),
            new BsonDocument("$group", new BsonDocument { { "_id", "$Path" }, { "count", new BsonDocument("$sum", 1) } }));
        Assert.DoesNotContain("COLLSCAN", backfill);
    }
}
