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
 * Description     :  How he works with clients, as the summary's second sentence: forward-deployed with the clients
 *                    who run Revalsys products. Added only to the summary the previous release left, so admin edits
 *                    are kept; matches src/data/profile.ts and the seed.
 */
public class Migration20261118ForwardDeployed(ProfileDAL profileDAL, TimeProvider timeProvider) : IMigration
{
    public const string Sentence = "Works forward-deployed: sits with the clients who run Revalsys products, scopes what they need and ships it into their production. ";

    public string Id => "0006-forward-deployed";

    public string Description => "Profile: forward-deployed work with product clients, in the summary.";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Apply
    // Method Description    :   Inserts the sentence after the summary's first one, if the summary is still the previous release's.
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
    /// <c>Apply : </c> Inserts the sentence after the summary's first one, if the summary is still the previous release's.
    /// </summary>
    public async Task<IReadOnlyList<string>> Apply()
    {
        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (profile == null || !profile.Summary.StartsWith(Migration20261118AgenticFullStack.NewOpening, StringComparison.Ordinal) || profile.Summary.Contains("forward-deployed", StringComparison.Ordinal))
        {
            // Nothing stored yet (the seed carries the text), edited by hand, or already there.
            return [];
        }
        int end = profile.Summary.IndexOf(". ", StringComparison.Ordinal);
        if (end < 0)
        {
            return [];
        }
        profile.Summary = profile.Summary[..(end + 2)] + Sentence + profile.Summary[(end + 2)..];
        profile.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;
        await profileDAL.UpsertProfileDB(profile);
        return ["profile"];
    }
}
