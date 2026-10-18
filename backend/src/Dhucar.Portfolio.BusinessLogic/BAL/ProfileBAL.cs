using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  SaveProfile validates the Now note and stamps the date it changed
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  The profile: public read and admin replace.
 */
public class ProfileBAL(ProfileDAL profileDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetProfile
    // Method Description    :   Returns the profile.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetProfile : </c> Returns the profile.
    /// </summary>
    public async Task<Response<object>> GetProfile()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            ProfileDocument? profile = await profileDAL.GetProfileDB();
            if (profile == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Profile not found.";
                return objResponse;
            }
            objResponse.Data = profile;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetProfile", string.Empty, nameof(GetProfile));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SaveProfile
    // Method Description    :   Validates and replaces the profile, then asks the site to refresh.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :   18 Oct 2026
    // Modified Reason       :   Now note: length check, and its date is set here when the text changes
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //  1.1        Boda Madhukar Reddy    18 Oct 2026       Now note and its change date
    //****************************************************************************************************
    /// <summary>
    /// <c>SaveProfile : </c> Validates and replaces the profile, then asks the site to refresh.
    /// </summary>
    public async Task<Response<object>> SaveProfile(SaveProfileRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            ProfileDocument? profile = objAPIRequest.Profile;
            string error = profile == null || profile.Name.Trim().Length is 0 or > 120 ? "Name is required."
                : profile.Summary.Length > 2000 ? "Summary is limited to 2,000 characters."
                : profile.Now.Trim().Length > MaxNowLength ? $"Now is limited to {MaxNowLength} characters."
                : !IsHttpsOrEmpty(profile.Github) || !IsHttpsOrEmpty(profile.Linkedin) || !IsHttpsOrEmpty(profile.Twitter) ? "Profile links must be https:// addresses."
                : profile.SkillCategories.Count > 20 || profile.Experience.Groups.Count > 20 ? "Too many skill groups or experience groups."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            // The Now date is the server's: it moves only when the text actually changes.
            ProfileDocument? existing = await profileDAL.GetProfileDB();
            profile!.Now = profile.Now.Trim();
            profile.NowUpdatedAt = profile.Now == (existing?.Now ?? string.Empty) ? existing?.NowUpdatedAt
                : profile.Now.Length > 0 ? DateTime.UtcNow : null;
            profile.UpdatedAt = DateTime.UtcNow;
            await profileDAL.UpsertProfileDB(profile);
            bool isRevalidated = await revalidationBAL.Revalidate(["profile"]);
            await auditBAL.Write("profile.saved", true, contextService.GetUserId(), contextService.GetEmail(), string.Empty);
            objResponse.Data = new SaveResultDTO { Id = profile.Id, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Profile saved.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SaveProfile", string.Empty, nameof(SaveProfile));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private const int MaxNowLength = 280;

    private static bool IsHttpsOrEmpty(string url)
    {
        return string.IsNullOrWhiteSpace(url) || (Uri.TryCreate(url.Trim(), UriKind.Absolute, out Uri? parsed) && parsed.Scheme == Uri.UriSchemeHttps);
    }
}
