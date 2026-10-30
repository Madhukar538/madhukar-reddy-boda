using Dhucar.Portfolio.BusinessLogic.BAL;
using Dhucar.Portfolio.BusinessLogic.Migrations;
using Dhucar.Portfolio.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class MigrationTests
{
    private const string MigrationId = "2026-10-30-senior-title-and-maf";

    private static async Task<IReadOnlyList<string>> RunPending(ApiFactory factory)
    {
        using IServiceScope scope = factory.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<MigrationBAL>().RunPending();
    }

    private static IMongoCollection<BsonDocument> Profile(ApiFactory factory) => factory.Database.GetCollection<BsonDocument>("profile");

    private static IMongoCollection<BsonDocument> Migrations(ApiFactory factory) => factory.Database.GetCollection<BsonDocument>("migrations");

    [Fact]
    public async Task Pending_migrations_run_on_start_and_are_recorded()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();

        BsonDocument record = await Migrations(factory).Find(new BsonDocument("_id", MigrationId)).SingleAsync();
        Assert.True(record.Contains("appliedAt") || record.Contains("AppliedAt"));
        Assert.Empty(await RunPending(factory));
    }

    [Fact]
    public async Task An_existing_profile_is_updated_once_and_later_edits_are_kept()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();

        // The live database before this release: old title, summary, role and chatbot bullet.
        BsonDocument old = await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        string titleField = old.Contains("title") ? "title" : "Title";
        string summaryField = old.Contains("summary") ? "summary" : "Summary";
        string experienceField = old.Contains("experience") ? "experience" : "Experience";
        string nowField = old.Contains("now") ? "now" : "Now";
        BsonDocument experience = old[experienceField].AsBsonDocument;
        string roleField = experience.Contains("title") ? "title" : "Title";
        string groupsField = experience.Contains("groups") ? "groups" : "Groups";
        string itemsField = experience[groupsField].AsBsonArray[0].AsBsonDocument.Contains("items") ? "items" : "Items";
        await Profile(factory).UpdateOneAsync(FilterDefinition<BsonDocument>.Empty, new BsonDocument("$set", new BsonDocument
        {
            { titleField, "Software Engineer" },
            { summaryField, "Backend-focused Software Engineer." },
            { nowField, "Kept as it was." },
            { $"{experienceField}.{roleField}", "Software Engineer" },
            { $"{experienceField}.{groupsField}.0.{itemsField}.0", "Architecting a multi-tenant RAG chatbot platform on .NET 10: Semantic Kernel agents, pgvector." },
        }));
        await Migrations(factory).DeleteOneAsync(new BsonDocument("_id", MigrationId));
        factory.Site.Requests.Clear();

        Assert.Equal([MigrationId], await RunPending(factory));

        BsonDocument updated = await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        Assert.Equal(Migration20261030SeniorTitleAndMaf.Title, updated[titleField].AsString);
        Assert.Equal(Migration20261030SeniorTitleAndMaf.Summary, updated[summaryField].AsString);
        Assert.Equal(Migration20261030SeniorTitleAndMaf.RoleTitle, updated[experienceField][roleField].AsString);
        Assert.Equal(
            "Architecting a multi-tenant RAG chatbot platform on .NET 10: Microsoft Agent Framework agents, pgvector.",
            updated[experienceField][groupsField][0][itemsField][0].AsString);
        Assert.Equal("Kept as it was.", updated[nowField].AsString);
        // The site is told to refresh the profile.
        Assert.Contains(factory.Site.Requests, r => r.Body.Contains("profile"));

        // Already recorded: an admin edit made after the release is not overwritten.
        await Profile(factory).UpdateOneAsync(FilterDefinition<BsonDocument>.Empty, Builders<BsonDocument>.Update.Set(titleField, "Principal Engineer"));
        Assert.Empty(await RunPending(factory));
        Assert.Equal("Principal Engineer", (await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync())[titleField].AsString);
    }
}
