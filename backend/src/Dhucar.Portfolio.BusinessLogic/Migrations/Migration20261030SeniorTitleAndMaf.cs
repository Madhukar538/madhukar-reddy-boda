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
 * Description     :  Senior title, the R&D and problem-solving summary, and the chatbot on Microsoft Agent Framework.
 */
public class Migration20261030SeniorTitleAndMaf(ProfileDAL profileDAL, TimeProvider timeProvider) : IMigration
{
    public const string Title = "Senior Software Engineer";

    public const string RoleTitle = "Senior Software Engineer (R&D)";

    public const string Summary =
        "Senior Software Engineer specialising in research and development and hard problem solving, with 5+ years building, optimizing and scaling high-traffic systems and self-hosted AI platforms. " +
        "Takes ambiguous problems from investigation to production: high-throughput .NET APIs, multi-tenant RAG and MCP platforms on Microsoft Agent Framework, and hybrid search, all validated with k6 + Grafana. " +
        "Production-first: diagnose fast, fix right, prevent recurrence.";

    public string Id => "2026-10-30-senior-title-and-maf";

    public string Description => "Profile: senior title, R&D summary, Revalsys role, chatbot agents on Microsoft Agent Framework.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Updates the profile's title, summary, role and chatbot bullet; leaves everything else.
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
    /// <c>Apply : </c> Updates the profile's title, summary, role and chatbot bullet; leaves everything else.
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
        profile.Experience.Title = RoleTitle;
        foreach (ExperienceGroupItem group in profile.Experience.Groups)
        {
            group.Items = group.Items
                .Select(item => item.Replace("Semantic Kernel agents", "Microsoft Agent Framework agents", StringComparison.Ordinal))
                .ToList();
        }
        profile.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;
        await profileDAL.UpsertProfileDB(profile);
        return ["profile"];
    }
}
