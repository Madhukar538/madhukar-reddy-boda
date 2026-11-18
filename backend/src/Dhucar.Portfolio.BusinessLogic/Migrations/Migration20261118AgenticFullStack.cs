using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties.Documents;

namespace Dhucar.Portfolio.BusinessLogic.Migrations;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Agentic full stack developer in place of agentic AI developer: the title, and the summary's
 *                    opening. Only text still as the previous release left it is changed, so admin edits are kept;
 *                    matches src/data/profile.ts and the seed.
 */
public class Migration20261118AgenticFullStack(ProfileDAL profileDAL, TimeProvider timeProvider) : IMigration
{
    public const string Title = "Senior Software Engineer · AI Architect · Agentic Full Stack Developer";

    /// <summary>The summary's opening before and after this release.</summary>
    public const string OldOpening = "Senior Software Engineer, AI architect and agentic AI developer";
    public const string NewOpening = "Senior Software Engineer, AI architect and agentic full stack developer";

    public string Id => "0005-agentic-full-stack";

    public string Description => "Profile: agentic full stack developer in the title and summary.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Sets the new title and summary opening where they are still the previous release's.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Site cache tags to refresh
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Apply : </c> Sets the new title and summary opening where they are still the previous release's.
    /// </summary>
    public async Task<IReadOnlyList<string>> Apply()
    {
        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (profile == null)
        {
            // Nothing stored yet: the seed already carries the new text.
            return [];
        }
        bool isChanged = false;
        if (profile.Title == Migration20261117AiArchitect.Title)
        {
            profile.Title = Title;
            isChanged = true;
        }
        if (profile.Summary.StartsWith(OldOpening, StringComparison.Ordinal))
        {
            profile.Summary = NewOpening + profile.Summary[OldOpening.Length..];
            isChanged = true;
        }
        if (!isChanged)
        {
            return [];
        }
        profile.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;
        await profileDAL.UpsertProfileDB(profile);
        return ["profile"];
    }
}
