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
 * Description     :  The single profile document.
 */
public class ProfileDAL(MongoContext context)
{
    private const string ProfileId = "profile";

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetProfileDB
    // Method Description    :   Reads the profile.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   ProfileDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetProfileDB : </c> Reads the profile.
    /// </summary>
    public async Task<ProfileDocument?> GetProfileDB()
    {
        return await context.Profile.Find(x => x.Id == ProfileId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertProfileDB
    // Method Description    :   Replaces the profile.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   profile
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertProfileDB : </c> Replaces the profile.
    /// </summary>
    public async Task UpsertProfileDB(ProfileDocument profile)
    {
        profile.Id = ProfileId;
        await context.Profile.ReplaceOneAsync(x => x.Id == ProfileId, profile, new ReplaceOptions { IsUpsert = true });
    }
}
