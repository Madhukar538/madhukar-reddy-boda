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
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Standalone pages made in the admin and served at /<slug>: published ones for anyone, drafts for
 *                    the admin. Content is sanitized like posts; saving refreshes the pages that show them.
 */
public partial class PageBAL(PageDAL pageDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, TimeProvider timeProvider, ICodeLogger codeLog)
{
    private const int MaxContentLength = 200_000;

    /// <summary>Addresses the site already uses (or keeps for itself): a page there could never be reached.</summary>
    public static readonly HashSet<string> ReservedSlugs = new(StringComparer.Ordinal)
    {
        "about", "admin", "ai", "api", "blog", "bug-log", "experience", "fix-a-bug", "graph", "lab", "mcp", "media",
        "og", "projects", "sitemap", "sites", "status", "ticket", "topics", "work-with-me", "resume", "feed", "rss",
    };

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPages
    // Method Description    :   The pages without their content: published ones for the site, or all of them for the admin.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   isPublishedOnly
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPages : </c> The pages without their content: published ones for the site, or all of them for the admin.
    /// </summary>
    public async Task<Response<object>> GetPages(bool isPublishedOnly)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<PageDocument> pages = await pageDAL.GetPagesDB(isPublishedOnly);
            objResponse.Data = pages.Select(x => ToDTO(x, isWithContent: false)).ToList();
            objResponse.RowCount = pages.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Pages.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPages", string.Empty, nameof(GetPages));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPage
    // Method Description    :   One page with its content: for the site only if published, for the admin always.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest, isPublishedOnly
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPage : </c> One page with its content: for the site only if published, for the admin always.
    /// </summary>
    public async Task<Response<object>> GetPage(PageSlugRequestDTO objAPIRequest, bool isPublishedOnly)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            PageDocument? page = SlugPattern().IsMatch(slug) ? await pageDAL.GetPageDB(slug) : null;
            if (page == null || (isPublishedOnly && !page.IsPublished))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Page not found.";
                return objResponse;
            }
            objResponse.Data = ToDTO(page, isWithContent: true);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Page.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPage", string.Empty, nameof(GetPage));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SavePage
    // Method Description    :   Creates or updates a page after checking its address and fields; a new address moves it.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SavePage : </c> Creates or updates a page after checking its address and fields; a new address moves it.
    /// </summary>
    public async Task<Response<object>> SavePage(SavePageRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            string originalSlug = (objAPIRequest.OriginalSlug ?? string.Empty).Trim();
            string title = (objAPIRequest.Title ?? string.Empty).Trim();
            string description = (objAPIRequest.Description ?? string.Empty).Trim();
            string content = objAPIRequest.Content ?? string.Empty;
            string error =
                slug.Length is 0 or > 64 || !SlugPattern().IsMatch(slug) ? "The address must be 1–64 lower-case letters, digits and hyphens (e.g. uses or my-setup)."
                : ReservedSlugs.Contains(slug) ? $"/{slug} is already a page on the site. Choose another address."
                : title.Length is 0 or > 120 ? "A title is required (up to 120 characters)."
                : description.Length > 300 ? "The description is limited to 300 characters."
                : content.Trim().Length == 0 || content.Length > MaxContentLength ? "Content is required (up to 200,000 characters)."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }

            PageDocument? existing = originalSlug.Length > 0 ? await pageDAL.GetPageDB(originalSlug) : null;
            if (slug != originalSlug && await pageDAL.GetPageDB(slug) != null)
            {
                objResponse.ReturnCode = (int)ErrorCode.Conflict;
                objResponse.ReturnMessage = $"There is already a page at /{slug}.";
                return objResponse;
            }

            DateTime now = timeProvider.GetUtcNow().UtcDateTime;
            await pageDAL.UpsertPageDB(new PageDocument
            {
                Id = slug,
                Title = title,
                Description = description,
                Content = PostBAL.SanitizeHtml(content),
                IsPublished = objAPIRequest.IsPublished,
                CreatedAt = existing?.CreatedAt ?? now,
                UpdatedAt = now,
            });
            List<string> tags = ["pages", $"page:{slug}"];
            if (existing != null && originalSlug != slug)
            {
                // Moved: the old address stops answering.
                await pageDAL.DeletePageDB(originalSlug);
                tags.Add($"page:{originalSlug}");
            }
            bool isRevalidated = await revalidationBAL.Revalidate(tags);
            await auditBAL.Write("page.saved", true, contextService.GetUserId(), contextService.GetEmail(), slug);
            objResponse.Data = new SaveResultDTO { Id = slug, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = objAPIRequest.IsPublished ? "Page saved and published." : "Page saved as a draft.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SavePage", string.Empty, nameof(SavePage));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   DeletePage
    // Method Description    :   Deletes a page and refreshes the site so its address stops answering.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeletePage : </c> Deletes a page and refreshes the site so its address stops answering.
    /// </summary>
    public async Task<Response<object>> DeletePage(PageSlugRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            if (!SlugPattern().IsMatch(slug) || !await pageDAL.DeletePageDB(slug))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Page not found.";
                return objResponse;
            }
            bool isRevalidated = await revalidationBAL.Revalidate(["pages", $"page:{slug}"]);
            await auditBAL.Write("page.deleted", true, contextService.GetUserId(), contextService.GetEmail(), slug);
            objResponse.Data = new SaveResultDTO { Id = slug, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Page deleted.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step DeletePage", string.Empty, nameof(DeletePage));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private static PageDTO ToDTO(PageDocument x, bool isWithContent) => new()
    {
        Slug = x.Id,
        Title = x.Title,
        Description = x.Description,
        Content = isWithContent ? x.Content : string.Empty,
        IsPublished = x.IsPublished,
        UpdatedAt = x.UpdatedAt,
    };
}
