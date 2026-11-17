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
    private const string MigrationId = "0001-senior-title-and-maf";

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
    public async Task Migrations_run_in_order_and_the_last_one_wins()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();

        // Run all again over an old profile: the bullets migration sets the groups, and the AI architect one (latest Id) the final summary.
        await Profile(factory).UpdateOneAsync(FilterDefinition<BsonDocument>.Empty, Builders<BsonDocument>.Update.Set("summary", "Old.").Set("Summary", "Old."));
        IMongoCollection<BsonDocument> projects = factory.Database.GetCollection<BsonDocument>("projects");
        BsonDocument jockey = await projects.Find(new BsonDocument("_id", "jockey")).SingleAsync();
        string durationField = jockey.Contains("duration") ? "duration" : "Duration";
        await projects.UpdateOneAsync(new BsonDocument("_id", "jockey"), Builders<BsonDocument>.Update.Set(durationField, "Jan 2021 – May 2023"));
        await Migrations(factory).DeleteManyAsync(FilterDefinition<BsonDocument>.Empty);
        Assert.Equal([MigrationId, "0002-experience-bullets", "0003-agentic-developer", "0004-ai-architect"], await RunPending(factory));
        Assert.Equal("Dec 2021 – May 2023", (await projects.Find(new BsonDocument("_id", "jockey")).SingleAsync())[durationField].AsString);

        BsonDocument profile = await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        string summaryField = profile.Contains("summary") ? "summary" : "Summary";
        Assert.Equal(Migration20261117AiArchitect.Summary, profile[summaryField].AsString);
        string experienceField = profile.Contains("experience") ? "experience" : "Experience";
        BsonDocument experience = profile[experienceField].AsBsonDocument;
        BsonArray groups = experience[experience.Contains("groups") ? "groups" : "Groups"].AsBsonArray;
        Assert.Equal(Migration20261030ExperienceBullets.Groups.Count, groups.Count);
    }

    [Fact]
    public async Task Agentic_migration_sets_title_summary_now_and_adds_the_skill_group_once()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();

        BsonDocument profile = await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        string titleField = profile.Contains("title") ? "title" : "Title";
        string nowField = profile.Contains("now") ? "now" : "Now";
        string skillsField = profile.Contains("skillCategories") ? "skillCategories" : "SkillCategories";
        // The AI architect migration runs after it and sets the final title; the Now note is the agentic one's.
        Assert.Equal(Migration20261117AiArchitect.Title, profile[titleField].AsString);
        Assert.Equal(Migration20261114AgenticDeveloper.Now, profile[nowField].AsString);

        // Run it again: the skill group is not added twice.
        await Migrations(factory).DeleteOneAsync(new BsonDocument("_id", "0003-agentic-developer"));
        Assert.Equal(["0003-agentic-developer"], await RunPending(factory));
        BsonArray groups = (await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync())[skillsField].AsBsonArray;
        Assert.Single(groups, g => g.AsBsonDocument.GetValue(g.AsBsonDocument.Contains("title") ? "title" : "Title").AsString == Migration20261114AgenticDeveloper.SkillTitle);
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

    [Fact]
    public async Task Ai_architect_migration_sets_title_and_summary_and_keeps_the_now_note()
    {
        using ApiFactory factory = new();
        factory.CreateApiClient();

        BsonDocument before = await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        string titleField = before.Contains("title") ? "title" : "Title";
        string summaryField = before.Contains("summary") ? "summary" : "Summary";
        string nowField = before.Contains("now") ? "now" : "Now";
        await Profile(factory).UpdateOneAsync(FilterDefinition<BsonDocument>.Empty, new BsonDocument("$set", new BsonDocument
        {
            { titleField, Migration20261114AgenticDeveloper.Title },
            { summaryField, Migration20261114AgenticDeveloper.Summary },
            { nowField, "Edited by hand." },
        }));
        await Migrations(factory).DeleteOneAsync(new BsonDocument("_id", "0004-ai-architect"));

        Assert.Equal(["0004-ai-architect"], await RunPending(factory));
        BsonDocument after = await Profile(factory).Find(FilterDefinition<BsonDocument>.Empty).SingleAsync();
        Assert.Equal(Migration20261117AiArchitect.Title, after[titleField].AsString);
        Assert.Contains("AI architect", after[summaryField].AsString);
        Assert.Equal("Edited by hand.", after[nowField].AsString);
    }
}
