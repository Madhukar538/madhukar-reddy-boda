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
 * Description     :  Résumé-quality experience bullets (consistent tense, full sentences, measured results) and a
 *                    results-first summary; matches src/data/profile.ts.
 */
public class Migration20261030ExperienceBullets(ProfileDAL profileDAL, TimeProvider timeProvider) : IMigration
{
    public const string Summary =
        "Senior Software Engineer with 5+ years of research and development, building and scaling high-traffic .NET systems and self-hosted AI platforms. Cut a multi-tenant RAG chatbot's answer time from 30–40 s to about 13 s, MongoDB query latency from up to 2 s to under 50 ms, and PR review cycle time by 30%. Works across .NET 10, Microsoft Agent Framework, MCP, Solr 9 hybrid search and k6 + Grafana, and takes ambiguous problems from investigation to production.";

    public static readonly List<ExperienceGroupItem> Groups =
    [
        new ExperienceGroupItem
        {
            Label = "AI platforms",
            Items =
            [
                "Architected a multi-tenant RAG chatbot platform on .NET 10 (Microsoft Agent Framework agents, pgvector, text-to-SQL, MCP tools, PII guardrails and SignalR streaming), cutting typical answer time from 30–40 s to about 13 s.",
                "Built an MCP (Model Context Protocol) server exposing 40+ tools that give AI assistants a map of C# codebases and SQL Server schemas, using Roslyn code analysis and schema extraction synced to MongoDB.",
                "Designed a hybrid product search engine on Solr 9 that fuses BM25 keyword and kNN vector results with Reciprocal Rank Fusion.",
                "Moved AI workloads to self-hosted LLMs (Ollama on an in-house GPU server), removing the dependency on cloud AI services.",
                "Integrated AI into internal workflows, including NLP chatbots, RAG systems and automated code review.",
            ],
        },
        new ExperienceGroupItem
        {
            Label = "Performance & tooling",
            Items =
            [
                "Created repeatable k6 load-testing suites with Grafana dashboards, setting SLA baselines and capacity models for mission-critical APIs.",
                "Tuned MongoDB compound and unique indexes for conversational platforms, cutting query latency from 500–2,000 ms to 5–50 ms.",
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
                "Led .NET-based R&D projects for rapid prototyping and system innovation.",
                "Migrated legacy systems to modern .NET hybrid architectures.",
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

    public string Id => "0002-experience-bullets";

    public string Description => "Profile: rewritten experience bullets and a results-first summary.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Replaces the experience groups and the summary; leaves everything else.
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
    /// <c>Apply : </c> Replaces the experience groups and the summary; leaves everything else.
    /// </summary>
    public async Task<IReadOnlyList<string>> Apply()
    {
        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (profile == null)
        {
            // Nothing stored yet: the seed already carries the new text.
            return [];
        }
        profile.Summary = Summary;
        profile.Experience.Groups = Groups
            .Select(g => new ExperienceGroupItem { Label = g.Label, Items = g.Items.ToList() })
            .ToList();
        profile.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;
        await profileDAL.UpsertProfileDB(profile);
        return ["profile"];
    }
}
