using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties.Documents;

namespace Dhucar.Portfolio.BusinessLogic.Migrations;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  AI architect alongside the agentic AI developer positioning: title and summary;
 *                    matches src/data/profile.ts and the seed.
 */
public class Migration20261117AiArchitect(ProfileDAL profileDAL, TimeProvider timeProvider) : IMigration
{
    public const string Title = "Senior Software Engineer · AI Architect · Agentic AI Developer";

    public const string Summary =
        "Senior Software Engineer, AI architect and agentic AI developer with nearly 5 years of research and development, building and scaling high-traffic .NET systems and self-hosted AI platforms. " +
        "Leads teams of AI coding agents (Claude Code, Codex, Copilot and Antigravity) with specs, skills and review, and owns what they ship: a product foundation in two days, and legacy worker services moved to .NET 10 in two. " +
        "Cut a multi-tenant RAG chatbot's answer time from 30–40 s to about 13 s and MongoDB query latency from up to 2 s to under 50 ms. " +
        "Works across .NET 10, Microsoft Agent Framework, MCP, Solr 9 hybrid search and k6 + Grafana.";

    public string Id => "0004-ai-architect";

    public string Description => "Profile: AI architect added to the title and summary.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Sets the title and summary; the Now note and skills are left as they are.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Site cache tags to refresh
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Apply : </c> Sets the title and summary; the Now note and skills are left as they are.
    /// </summary>
    public async Task<IReadOnlyList<string>> Apply()
    {
        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (profile == null)
        {
            // Nothing stored yet: the seed already carries the new text.
            return [];
        }
        profile.Title = Title;
        profile.Summary = Summary;
        profile.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;
        await profileDAL.UpsertProfileDB(profile);
        return ["profile"];
    }
}
