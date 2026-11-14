using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties.Documents;

namespace Dhucar.Portfolio.BusinessLogic.Migrations;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Agentic AI developer positioning: title, summary, Now note and an "Agentic Development" skill group;
 *                    matches src/data/profile.ts and the seed.
 */
public class Migration20261114AgenticDeveloper(ProfileDAL profileDAL, TimeProvider timeProvider) : IMigration
{
    public const string Title = "Senior Software Engineer · Agentic AI Developer";

    public const string Summary =
        "Senior Software Engineer and agentic AI developer with nearly 5 years of research and development, building and scaling high-traffic .NET systems and self-hosted AI platforms. " +
        "Leads teams of AI coding agents (Claude Code, Codex, Copilot and Antigravity) with specs, skills and review, and owns what they ship: a product foundation in two days, and legacy worker services moved to .NET 10 in two. " +
        "Cut a multi-tenant RAG chatbot's answer time from 30–40 s to about 13 s and MongoDB query latency from up to 2 s to under 50 ms. " +
        "Works across .NET 10, Microsoft Agent Framework, MCP, Solr 9 hybrid search and k6 + Grafana.";

    public const string Now = "Running a team of AI coding agents in Herdr: Claude Code leads; Antigravity, Copilot and Codex build and review.";

    public const string SkillTitle = "Agentic Development";

    public static readonly List<string> Skills = ["Claude Code", "OpenAI Codex", "GitHub Copilot CLI", "Google Antigravity", "Cursor", "Herdr", "Agent Skills", "MCP servers", "Multi-agent review", "AI evals"];

    public string Id => "0003-agentic-developer";

    public string Description => "Profile: agentic AI developer title, summary and Now note; Agentic Development skill group.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Sets the title, summary and Now note, and adds the Agentic Development skill group if missing.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   14 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Site cache tags to refresh
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    14 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Apply : </c> Sets the title, summary and Now note, and adds the Agentic Development skill group if missing.
    /// </summary>
    public async Task<IReadOnlyList<string>> Apply()
    {
        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (profile == null)
        {
            // Nothing stored yet: the seed already carries the new text.
            return [];
        }
        DateTime now = timeProvider.GetUtcNow().UtcDateTime;
        profile.Title = Title;
        profile.Summary = Summary;
        profile.Now = Now;
        profile.NowUpdatedAt = now;
        if (!profile.SkillCategories.Any(x => x.Title == SkillTitle))
        {
            // Second, straight after Languages, so it reads as a headline skill.
            int index = Math.Min(1, profile.SkillCategories.Count);
            profile.SkillCategories.Insert(index, new SkillCategoryItem { Title = SkillTitle, Color = "amber", Skills = Skills.ToList() });
        }
        profile.UpdatedAt = now;
        await profileDAL.UpsertProfileDB(profile);
        return ["profile"];
    }
}
