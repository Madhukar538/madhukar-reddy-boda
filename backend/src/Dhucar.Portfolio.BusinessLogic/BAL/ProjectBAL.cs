using System.Text.RegularExpressions;
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
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Projects (key systems, client builds, Lab experiments): public reads and admin edits.
 */
public partial class ProjectBAL(ProjectDAL projectDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    private static readonly string[] Kinds = ["key", "client", "lab"];
    private static readonly string[] Statuses = ["SHIPPED", "WIP", "POC", "RESEARCH"];

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugCharacters();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetProjects
    // Method Description    :   Lists projects: published only for the public, everything for a signed-in admin.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest, isAdmin
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetProjects : </c> Lists projects: published only for the public, everything for a signed-in admin.
    /// </summary>
    public async Task<Response<object>> GetProjects(GetProjectsRequestDTO objAPIRequest, bool isAdmin)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string kind = (objAPIRequest.Kind ?? string.Empty).Trim().ToLowerInvariant();
            if (kind.Length > 0 && !Kinds.Contains(kind))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Kind must be key, client or lab.";
                return objResponse;
            }
            List<ProjectDocument> projects = await projectDAL.GetProjectsDB(kind, !isAdmin);
            objResponse.Data = projects;
            objResponse.RowCount = projects.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetProjects", string.Empty, nameof(GetProjects));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SaveProject
    // Method Description    :   Validates and saves a project, then asks the site to refresh.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SaveProject : </c> Validates and saves a project, then asks the site to refresh.
    /// </summary>
    public async Task<Response<object>> SaveProject(SaveProjectRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string kind = (objAPIRequest.Kind ?? string.Empty).Trim().ToLowerInvariant();
            string title = (objAPIRequest.Title ?? string.Empty).Trim();
            string status = (objAPIRequest.Status ?? string.Empty).Trim().ToUpperInvariant();
            string url = (objAPIRequest.Url ?? string.Empty).Trim();
            List<string> tech = Clean(objAPIRequest.Tech, 20, 60);
            List<string> responsibilities = Clean(objAPIRequest.Responsibilities, 20, 400);
            string error = !Kinds.Contains(kind) ? "Kind must be key, client or lab."
                : title.Length is 0 or > 160 ? "Title is required (up to 160 characters)."
                : (objAPIRequest.Description ?? string.Empty).Length > 2000 ? "Description is limited to 2,000 characters."
                : kind == "lab" && !Statuses.Contains(status) ? "Lab status must be SHIPPED, WIP, POC or RESEARCH."
                : url.Length > 0 && !(Uri.TryCreate(url, UriKind.Absolute, out Uri? parsed) && parsed.Scheme == Uri.UriSchemeHttps) ? "URL must be an https:// address."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            string projectId = (objAPIRequest.Id ?? string.Empty).Trim();
            if (projectId.Length == 0)
            {
                projectId = NonSlugCharacters().Replace(title.ToLowerInvariant(), "-").Trim('-');
            }
            ProjectDocument project = new ProjectDocument
            {
                Id = projectId.Length > 96 ? projectId[..96] : projectId,
                Kind = kind,
                Title = title,
                Description = (objAPIRequest.Description ?? string.Empty).Trim(),
                Tech = tech,
                Post = (objAPIRequest.Post ?? string.Empty).Trim(),
                IsFeatured = kind == "key" && objAPIRequest.IsFeatured,
                Outcome = kind == "key" ? (objAPIRequest.Outcome ?? string.Empty).Trim() : string.Empty,
                Status = kind == "lab" ? status : string.Empty,
                Client = kind == "client" ? (objAPIRequest.Client ?? string.Empty).Trim() : string.Empty,
                Role = kind == "client" ? (objAPIRequest.Role ?? string.Empty).Trim() : string.Empty,
                Duration = kind == "client" ? (objAPIRequest.Duration ?? string.Empty).Trim() : string.Empty,
                Url = kind == "client" ? url : string.Empty,
                Responsibilities = kind == "client" ? responsibilities : new List<string>(),
                SortOrder = objAPIRequest.SortOrder,
                IsPublished = objAPIRequest.IsPublished,
                UpdatedAt = DateTime.UtcNow,
            };
            await projectDAL.UpsertProjectDB(project);
            bool isRevalidated = await revalidationBAL.Revalidate(["projects"]);
            await auditBAL.Write("project.saved", true, contextService.GetUserId(), contextService.GetEmail(), project.Id);
            objResponse.Data = new SaveResultDTO { Id = project.Id, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Project saved.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SaveProject", string.Empty, nameof(SaveProject));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   DeleteProject
    // Method Description    :   Deletes a project and asks the site to refresh.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteProject : </c> Deletes a project and asks the site to refresh.
    /// </summary>
    public async Task<Response<object>> DeleteProject(DeleteItemRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string projectId = (objAPIRequest.Id ?? string.Empty).Trim();
            if (!await projectDAL.DeleteProjectDB(projectId))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Project not found.";
                return objResponse;
            }
            bool isRevalidated = await revalidationBAL.Revalidate(["projects"]);
            await auditBAL.Write("project.deleted", true, contextService.GetUserId(), contextService.GetEmail(), projectId);
            objResponse.Data = new SaveResultDTO { Id = projectId, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Project deleted.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step DeleteProject", string.Empty, nameof(DeleteProject));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private static List<string> Clean(List<string>? values, int maxCount, int maxLength)
    {
        return (values ?? new List<string>())
            .Select(x => x.Trim())
            .Where(x => x.Length > 0)
            .Select(x => x.Length > maxLength ? x[..maxLength] : x)
            .Distinct()
            .Take(maxCount)
            .ToList();
    }
}
