using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties.Documents;

namespace Dhucar.Portfolio.BusinessLogic.Migrations;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  30 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Résumé-quality experience bullets (consistent tense, full sentences, measured results), a
 *                    results-first summary, and dates that start at the Dec 2021 Revalsys start (the role and the
 *                    client projects that were dated earlier); matches src/data/profile.ts and the seed.
 */
public class Migration20261030ExperienceBullets(ProfileDAL profileDAL, ProjectDAL projectDAL, TimeProvider timeProvider) : IMigration
{
    public const string Summary =
        "Senior Software Engineer with nearly 5 years of research and development, building and scaling high-traffic .NET systems and self-hosted AI platforms. Cut a multi-tenant RAG chatbot's answer time from 30–40 s to about 13 s, MongoDB query latency from up to 2 s to under 50 ms, and PR review cycle time by 30%. Works across .NET 10, Microsoft Agent Framework, MCP, Solr 9 hybrid search and k6 + Grafana, and takes ambiguous problems from investigation to production.";

    public const string Duration = "Dec 2021 – Present";

    public static readonly List<ExperienceGroupItem> Groups =
    [
        new ExperienceGroupItem
        {
            Label = "AI platforms",
            Items =
            [
                "Architected a multi-tenant RAG chatbot platform on .NET 10 (Microsoft Agent Framework agents, pgvector, text-to-SQL, MCP tools, PII guardrails and SignalR streaming), then led an end-to-end latency audit that cut typical answer time from 30–40 s to about 13 s.",
                "Built an MCP (Model Context Protocol) server exposing 40+ tools that give AI assistants a map of C# codebases and SQL Server schemas, using Roslyn code analysis and schema extraction synced to MongoDB.",
                "Designed a hybrid product search engine on Solr 9 that fuses BM25 keyword and kNN vector results with Reciprocal Rank Fusion.",
                "Moved AI workloads to self-hosted LLMs (Ollama on an in-house GPU server), saving about ₹10,000 a month in cloud AI costs.",
                "Integrated AI into internal workflows, including NLP chatbots, RAG systems and automated code review.",
            ],
        },
        new ExperienceGroupItem
        {
            Label = "Performance & tooling",
            Items =
            [
                "Created repeatable k6 load-testing suites with Grafana dashboards, setting SLA baselines and capacity models for mission-critical APIs.",
                "Diagnosed full collection scans behind slow conversation queries and fixed them with compound and unique MongoDB indexes, cutting query latency from 500–2,000 ms to 5–50 ms.",
                "Developed a CI/CD code-review assistant on local LLMs, reducing PR review cycle time by 30%.",
                "Engineered enterprise data pipelines and SAP integration channels with zero-loss transactional sync.",
            ],
        },
        new ExperienceGroupItem
        {
            Label = "Architecture & R&D",
            Items =
            [
                "Prototyped an offline-first procurement and inspection app (Next.js PWA with Android SQLite) with outbox-based sync (in progress).",
                "Extended Uptime Kuma into an uptime and incident-management platform with a .NET API, push alerts and ticketing (in progress).",
                "Led all of the company’s .NET R&D projects as the sole lead, from rapid prototypes to working systems.",
                "Migrated RevalERP’s legacy systems to modern .NET hybrid architectures.",
                "Produced proofs of concept for IoT (MQTT), debugging tools and context-aware assistants.",
                "Implemented an RDLC reporting application for internal workflows, from requirements through delivery.",
            ],
        },
        new ExperienceGroupItem
        {
            Label = "Client delivery",
            Items =
            [
                "Delivered core features for 5 high-traffic e-commerce brands (Jockey, Speedo, Manyavar, LuxCozi and Fossil India) on Angular and .NET.",
                "Led the ONDC (Open Network for Digital Commerce) protocol integration.",
                "Shipped core modules across the 6-product RevalSuite: RevalERP, RevalHRM, RevalCRM, RevalPOS, RevalCMS and RevalInventory.",
                "Built Reval Meet, a video conferencing platform on WebRTC, SignalR and Node.js.",
            ],
        },
    ];

    /// <summary>Client projects whose dates began before the Dec 2021 start, by project id.</summary>
    public static readonly Dictionary<string, string> ClientProjectDates = new()
    {
        ["jockey"] = "Dec 2021 – May 2023",
        ["manyavar"] = "Dec 2021 – Jan 2022",
        ["luxcozi"] = "Dec 2021 – Jan 2022",
        ["speedo"] = "Dec 2021",
    };

    public string Id => "0002-experience-bullets";

    public string Description => "Profile: rewritten experience bullets, results-first summary, Dec 2021 start; client project dates.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Replaces the experience groups, summary and duration; corrects client project dates.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   30 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Site cache tags to refresh
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    30 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Apply : </c> Replaces the experience groups, summary and duration; corrects client project dates.
    /// </summary>
    public async Task<IReadOnlyList<string>> Apply()
    {
        List<string> tags = new List<string>();
        DateTime now = timeProvider.GetUtcNow().UtcDateTime;
        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (profile != null)
        {
            profile.Summary = Summary;
            profile.Experience.Duration = Duration;
            profile.Experience.Groups = Groups
                .Select(g => new ExperienceGroupItem { Label = g.Label, Items = g.Items.ToList() })
                .ToList();
            profile.UpdatedAt = now;
            await profileDAL.UpsertProfileDB(profile);
            tags.Add("profile");
        }
        foreach ((string projectId, string duration) in ClientProjectDates)
        {
            ProjectDocument? project = await projectDAL.GetProjectDB(projectId);
            if (project != null && project.Duration != duration)
            {
                project.Duration = duration;
                project.UpdatedAt = now;
                await projectDAL.UpsertProjectDB(project);
                if (!tags.Contains("projects"))
                {
                    tags.Add("projects");
                }
            }
        }
        return tags;
    }
}
