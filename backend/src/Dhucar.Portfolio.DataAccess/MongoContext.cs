using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Covering indexes for the traffic reports; keeps warm connections to the cluster
 * Layer           :  DataAccess
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Single MongoDB client and typed collections; creates indexes (including TTL retention) at startup.
 */
public class MongoContext
{
    private readonly int _retentionDays;

    public MongoContext(IOptions<PortfolioSettings> options)
    {
        PortfolioSettings settings = options.Value;
        MongoClientSettings clientSettings = MongoClientSettings.FromConnectionString(settings.Mongo.ConnectionString);
        // Keep a couple of connections open even when the site is quiet, so the first request after
        // a lull doesn't pay for a fresh TLS handshake to the cluster.
        clientSettings.MinConnectionPoolSize = 2;
        MongoClient client = new MongoClient(clientSettings);
        Database = client.GetDatabase(settings.Mongo.Database);
        _retentionDays = Math.Clamp(settings.Tracking.RetentionDays, 1, 3650);
    }

    /// <summary>The application database.</summary>
    public IMongoDatabase Database { get; }

    /// <summary>Admin users.</summary>
    public IMongoCollection<AdminUserDocument> Users => Database.GetCollection<AdminUserDocument>("adminUsers");

    /// <summary>Passkeys.</summary>
    public IMongoCollection<PasskeyDocument> Passkeys => Database.GetCollection<PasskeyDocument>("passkeys");

    /// <summary>Single-use challenges.</summary>
    public IMongoCollection<AuthChallengeDocument> Challenges => Database.GetCollection<AuthChallengeDocument>("authChallenges");

    /// <summary>Refresh tokens.</summary>
    public IMongoCollection<RefreshTokenDocument> RefreshTokens => Database.GetCollection<RefreshTokenDocument>("refreshTokens");

    /// <summary>Audit log.</summary>
    public IMongoCollection<AuditLogDocument> AuditLog => Database.GetCollection<AuditLogDocument>("auditLog");

    /// <summary>Blog posts.</summary>
    public IMongoCollection<PostDocument> Posts => Database.GetCollection<PostDocument>("posts");

    /// <summary>Projects.</summary>
    public IMongoCollection<ProjectDocument> Projects => Database.GetCollection<ProjectDocument>("projects");

    /// <summary>Profile.</summary>
    public IMongoCollection<ProfileDocument> Profile => Database.GetCollection<ProfileDocument>("profile");

    /// <summary>Page views.</summary>
    public IMongoCollection<PageViewDocument> PageViews => Database.GetCollection<PageViewDocument>("pageViews");

    /// <summary>Daily visitor-hash salts.</summary>
    public IMongoCollection<DailySaltDocument> DailySalts => Database.GetCollection<DailySaltDocument>("dailySalts");

    /// <summary>Owner-edited switches (one document, _id "security").</summary>
    public IMongoCollection<SecuritySettingsDocument> Settings => Database.GetCollection<SecuritySettingsDocument>("settings");

    /// <summary>Per-post reads and reactions.</summary>
    public IMongoCollection<PostStatsDocument> PostStats => Database.GetCollection<PostStatsDocument>("postStats");

    /// <summary>Reader comments.</summary>
    public IMongoCollection<CommentDocument> Comments => Database.GetCollection<CommentDocument>("comments");

    /// <summary>Support tickets.</summary>
    public IMongoCollection<TicketDocument> Tickets => Database.GetCollection<TicketDocument>("tickets");

    /// <summary>Uploaded images.</summary>
    public IMongoCollection<MediaDocument> Media => Database.GetCollection<MediaDocument>("media");

    /// <summary>Data migrations already applied (MigrationBAL).</summary>
    public IMongoCollection<MigrationDocument> Migrations => Database.GetCollection<MigrationDocument>("migrations");

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   EnsureIndexes
    // Method Description    :   Creates unique, lookup and TTL indexes; safe to run on every start.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :   18 Oct 2026
    // Modified Reason       :   Covering indexes for each traffic report, and page views by path
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    18 Oct 2026       Traffic report indexes
    //****************************************************************************************************
    /// <summary>
    /// <c>EnsureIndexes : </c> Creates unique, lookup and TTL indexes; safe to run on every start.
    /// </summary>
    public async Task EnsureIndexes()
    {
        await Users.Indexes.CreateOneAsync(new CreateIndexModel<AdminUserDocument>(
            Builders<AdminUserDocument>.IndexKeys.Ascending(x => x.Email), new CreateIndexOptions { Unique = true }));
        await Passkeys.Indexes.CreateOneAsync(new CreateIndexModel<PasskeyDocument>(
            Builders<PasskeyDocument>.IndexKeys.Ascending(x => x.UserId)));
        await Challenges.Indexes.CreateOneAsync(new CreateIndexModel<AuthChallengeDocument>(
            Builders<AuthChallengeDocument>.IndexKeys.Ascending(x => x.ExpiresAt), new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }));
        await RefreshTokens.Indexes.CreateManyAsync([
            new CreateIndexModel<RefreshTokenDocument>(Builders<RefreshTokenDocument>.IndexKeys.Ascending(x => x.ExpiresAt), new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }),
            new CreateIndexModel<RefreshTokenDocument>(Builders<RefreshTokenDocument>.IndexKeys.Ascending(x => x.FamilyId)),
            new CreateIndexModel<RefreshTokenDocument>(Builders<RefreshTokenDocument>.IndexKeys.Ascending(x => x.UserId)),
        ]);
        await AuditLog.Indexes.CreateOneAsync(new CreateIndexModel<AuditLogDocument>(
            Builders<AuditLogDocument>.IndexKeys.Descending(x => x.At), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(400) }));
        await Posts.Indexes.CreateOneAsync(new CreateIndexModel<PostDocument>(
            Builders<PostDocument>.IndexKeys.Ascending(x => x.IsPublished).Descending(x => x.PublishedAt)));
        await Projects.Indexes.CreateOneAsync(new CreateIndexModel<ProjectDocument>(
            Builders<ProjectDocument>.IndexKeys.Ascending(x => x.Kind).Ascending(x => x.SortOrder)));
        await PageViews.Indexes.CreateManyAsync([
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Timestamp), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(_retentionDays) }),
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Day).Ascending(x => x.Path)),
            // One per traffic report, so each is answered from the index alone (no document reads).
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Day).Ascending(x => x.VisitorHash)),
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Day).Ascending(x => x.ReferrerHost)),
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Day).Ascending(x => x.Device)),
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Day).Ascending(x => x.Country)),
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Day).Ascending(x => x.UtmSource)),
            // Read counts by post path (an anchored prefix regex can use it).
            new CreateIndexModel<PageViewDocument>(Builders<PageViewDocument>.IndexKeys.Ascending(x => x.Path)),
        ]);
        await DailySalts.Indexes.CreateOneAsync(new CreateIndexModel<DailySaltDocument>(
            Builders<DailySaltDocument>.IndexKeys.Ascending(x => x.CreatedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(2) }));
        await PostStats.Indexes.CreateOneAsync(new CreateIndexModel<PostStatsDocument>(
            Builders<PostStatsDocument>.IndexKeys.Descending(x => x.Reads)));
        await Comments.Indexes.CreateManyAsync([
            new CreateIndexModel<CommentDocument>(Builders<CommentDocument>.IndexKeys.Ascending(x => x.Slug).Ascending(x => x.Status).Ascending(x => x.CreatedAt)),
            new CreateIndexModel<CommentDocument>(Builders<CommentDocument>.IndexKeys.Ascending(x => x.Status).Descending(x => x.CreatedAt)),
        ]);
        await Tickets.Indexes.CreateManyAsync([
            new CreateIndexModel<TicketDocument>(Builders<TicketDocument>.IndexKeys.Ascending(x => x.Status).Descending(x => x.CreatedAt)),
            new CreateIndexModel<TicketDocument>(Builders<TicketDocument>.IndexKeys.Ascending(x => x.Priority).Ascending(x => x.Status)),
            new CreateIndexModel<TicketDocument>(Builders<TicketDocument>.IndexKeys.Descending(x => x.CreatedAt)),
            new CreateIndexModel<TicketDocument>(Builders<TicketDocument>.IndexKeys.Ascending(x => x.ResolvedAt), new CreateIndexOptions { Sparse = true }),
        ]);
        await Media.Indexes.CreateOneAsync(new CreateIndexModel<MediaDocument>(Builders<MediaDocument>.IndexKeys.Descending(x => x.UploadedAt)));
    }
}
