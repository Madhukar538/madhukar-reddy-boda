using System.Text;
using System.Text.Json;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  The Editorial homepage story per site: read publicly, saved by the admin. The API checks it is a JSON object
 *                    of sane size with the expected sections; the site validates the full shape before showing it
 *                    and falls back to its built-in story otherwise, so a bad save can't break the page.
 */
public class StoryBAL(StoryDAL storyDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    /// <summary>Largest story accepted, in UTF-8 bytes.</summary>
    public const int MaxBytes = 64 * 1024;

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetStory
    // Method Description    :   The site's story JSON, or empty when none is saved.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetStory : </c> The site's story JSON, or empty when none is saved.
    /// </summary>
    public async Task<Response<object>> GetStory()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            StoryDocument? story = await storyDAL.GetStoryDB();
            objResponse.Data = new StoryDTO { Json = story?.Json ?? string.Empty, UpdatedAt = story?.UpdatedAt };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Story.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetStory", string.Empty, nameof(GetStory));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SaveStory
    // Method Description    :   Saves the site's story after checking its size and outline (empty removes it), then refreshes the homepage.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SaveStory : </c> Saves the site's story after checking its size and outline (empty removes it), then refreshes the homepage.
    /// </summary>
    public async Task<Response<object>> SaveStory(SaveStoryRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string json = (objAPIRequest.Json ?? string.Empty).Trim();
            string error = json.Length == 0 ? string.Empty : Check(json);
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            if (json.Length == 0)
            {
                await storyDAL.DeleteStoryDB();
            }
            else
            {
                await storyDAL.UpsertStoryDB(new StoryDocument { Json = json, UpdatedAt = DateTime.UtcNow });
            }
            bool isRevalidated = await revalidationBAL.Revalidate(["story"]);
            await auditBAL.Write(json.Length == 0 ? "story.reset" : "story.saved", true, contextService.GetUserId(), contextService.GetEmail(), $"{Encoding.UTF8.GetByteCount(json)} bytes");
            objResponse.Data = new SaveResultDTO { Id = StoryDocument.DocumentId, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = json.Length == 0 ? "Story reset." : "Story saved.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SaveStory", string.Empty, nameof(SaveStory));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>Why a story can't be saved, or empty: too big, not JSON, or missing its hero, running band or chapters.</summary>
    private static string Check(string json)
    {
        if (Encoding.UTF8.GetByteCount(json) > MaxBytes)
        {
            return $"The story is limited to {MaxBytes / 1024} KB.";
        }
        try
        {
            using JsonDocument document = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 16 });
            JsonElement root = document.RootElement;
            bool isOutlined = root.ValueKind == JsonValueKind.Object
                && root.TryGetProperty("hero", out JsonElement hero) && hero.ValueKind == JsonValueKind.Object
                && root.TryGetProperty("ticker", out JsonElement ticker) && ticker.ValueKind == JsonValueKind.Array
                && root.TryGetProperty("story", out JsonElement story) && story.ValueKind == JsonValueKind.Object
                && story.TryGetProperty("chapters", out JsonElement chapters) && chapters.ValueKind == JsonValueKind.Array;
            return isOutlined ? string.Empty : "The story needs hero, ticker and story.chapters.";
        }
        catch (JsonException)
        {
            return "The story isn't valid JSON.";
        }
    }
}
