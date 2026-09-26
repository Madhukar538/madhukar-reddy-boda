using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Single-use, expiring challenges.
 */
public class ChallengeDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertChallengeDB
    // Method Description    :   Stores a challenge.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   challenge
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertChallengeDB : </c> Stores a challenge.
    /// </summary>
    public async Task InsertChallengeDB(AuthChallengeDocument challenge)
    {
        await context.Challenges.InsertOneAsync(challenge);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   TakeChallengeDB
    // Method Description    :   Atomically removes and returns an unexpired challenge of the given kind, so it can be used only once.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   challengeId, kind
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   AuthChallengeDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>TakeChallengeDB : </c> Atomically removes and returns an unexpired challenge of the given kind, so it can be used only once.
    /// </summary>
    public async Task<AuthChallengeDocument?> TakeChallengeDB(string challengeId, string kind)
    {
        DateTime now = DateTime.UtcNow;
        return await context.Challenges.FindOneAndDeleteAsync(x => x.Id == challengeId && x.Kind == kind && x.ExpiresAt > now);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   PeekChallengeDB
    // Method Description    :   Reads an unexpired challenge without consuming it (MFA retries within the window).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   challengeId, kind
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   AuthChallengeDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>PeekChallengeDB : </c> Reads an unexpired challenge without consuming it (MFA retries within the window).
    /// </summary>
    public async Task<AuthChallengeDocument?> PeekChallengeDB(string challengeId, string kind)
    {
        DateTime now = DateTime.UtcNow;
        return await context.Challenges.Find(x => x.Id == challengeId && x.Kind == kind && x.ExpiresAt > now).FirstOrDefaultAsync();
    }
}
