using System.Globalization;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;
using Ganss.Xss;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Paged admin list, single-post load for the editor, and a picker list
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Blog posts: public reads of published posts, admin create/update/delete with validation and HTML sanitising.
 */
public partial class PostBAL(PostDAL postDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    private const int MaxContentLength = 200_000;
    private static readonly HtmlSanitizer Sanitizer = CreateSanitizer();

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPosts
    // Method Description    :   Lists posts: published only for the public, everything for a signed-in admin.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   isAdmin
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPosts : </c> Lists posts: published only for the public, everything for a signed-in admin.
    /// </summary>
    public async Task<Response<object>> GetPosts(bool isAdmin)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<PostDocument> posts = await postDAL.GetPostsDB(!isAdmin);
            if (!isAdmin)
            {
                // The editor's email is admin-only information.
                posts.ForEach(x => x.UpdatedBy = string.Empty);
            }
            objResponse.Data = posts;
            objResponse.RowCount = posts.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPosts", string.Empty, nameof(GetPosts));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPost
    // Method Description    :   Returns one published post by slug.
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
    /// <c>GetPost : </c> Returns one published post by slug.
    /// </summary>
    public async Task<Response<object>> GetPost(GetPostRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            PostDocument? post = slug.Length is > 0 and <= 96 ? await postDAL.GetPostDB(slug) : null;
            if (post == null || !post.IsPublished)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Post not found.";
                return objResponse;
            }
            post.UpdatedBy = string.Empty;
            objResponse.Data = post;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPost", string.Empty, nameof(GetPost));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SavePost
    // Method Description    :   Validates, sanitises and saves a post, then asks the site to refresh it.
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
    /// <c>SavePost : </c> Validates, sanitises and saves a post, then asks the site to refresh it.
    /// </summary>
    public async Task<Response<object>> SavePost(SavePostRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            string title = (objAPIRequest.Title ?? string.Empty).Trim();
            List<string> tags = (objAPIRequest.Tags ?? new List<string>()).Select(x => x.Trim()).Where(x => x.Length > 0).Distinct().ToList();
            string error = slug.Length is 0 or > 96 || !SlugPattern().IsMatch(slug) ? "Slug must be lowercase letters, digits and hyphens."
                : title.Length is 0 or > 200 ? "Title is required (up to 200 characters)."
                : (objAPIRequest.Excerpt ?? string.Empty).Length > 500 ? "Excerpt is limited to 500 characters."
                : (objAPIRequest.Content ?? string.Empty).Length is 0 or > MaxContentLength ? "Content is required (up to 200,000 characters)."
                : (objAPIRequest.Category ?? string.Empty).Trim().Length is 0 or > 60 ? "Category is required (up to 60 characters)."
                : tags.Count > 12 || tags.Any(x => x.Length > 40) ? "Up to 12 tags of 40 characters each."
                : !DateTime.TryParseExact((objAPIRequest.Date ?? string.Empty).Trim(), "MMMM d, yyyy", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out _) ? "Date must look like \"September 26, 2026\"."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            string date = objAPIRequest.Date!.Trim();
            PostDocument post = new PostDocument
            {
                Id = slug,
                Title = title,
                Excerpt = (objAPIRequest.Excerpt ?? string.Empty).Trim(),
                Content = SanitizeHtml(objAPIRequest.Content!),
                Date = date,
                PublishedAt = DateTime.ParseExact(date, "MMMM d, yyyy", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal),
                Category = objAPIRequest.Category!.Trim(),
                Tags = tags,
                IsPublished = objAPIRequest.IsPublished,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = contextService.GetEmail(),
            };
            await postDAL.UpsertPostDB(post);
            bool isRevalidated = await revalidationBAL.Revalidate(["posts", $"post:{slug}"]);
            await auditBAL.Write("post.saved", true, contextService.GetUserId(), contextService.GetEmail(), slug);
            objResponse.Data = new SaveResultDTO { Id = slug, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Post saved.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SavePost", string.Empty, nameof(SavePost));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   DeletePost
    // Method Description    :   Deletes a post and asks the site to refresh.
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
    /// <c>DeletePost : </c> Deletes a post and asks the site to refresh.
    /// </summary>
    public async Task<Response<object>> DeletePost(DeleteItemRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Id ?? string.Empty).Trim();
            if (!await postDAL.DeletePostDB(slug))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Post not found.";
                return objResponse;
            }
            bool isRevalidated = await revalidationBAL.Revalidate(["posts", $"post:{slug}"]);
            await auditBAL.Write("post.deleted", true, contextService.GetUserId(), contextService.GetEmail(), slug);
            objResponse.Data = new SaveResultDTO { Id = slug, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Post deleted.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step DeletePost", string.Empty, nameof(DeletePost));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SanitizeHtml
    // Method Description    :   Keeps only the tags and attributes posts use; strips scripts, event handlers, styles and unsafe URLs.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   html
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SanitizeHtml : </c> Keeps only the tags and attributes posts use; strips scripts, event handlers, styles and unsafe URLs.
    /// </summary>
    public static string SanitizeHtml(string html)
    {
        return Sanitizer.Sanitize(html);
    }

    private static HtmlSanitizer CreateSanitizer()
    {
        HtmlSanitizer sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        foreach (string tag in new[] { "p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "code", "pre", "blockquote", "a", "br", "hr", "figure", "figcaption", "img", "table", "thead", "tbody", "tr", "th", "td", "span", "div", "sup", "sub", "kbd", "del", "details", "summary" })
        {
            sanitizer.AllowedTags.Add(tag);
        }
        sanitizer.AllowedAttributes.Clear();
        foreach (string attribute in new[] { "class", "href", "title", "src", "alt", "width", "height", "id", "open" })
        {
            sanitizer.AllowedAttributes.Add(attribute);
        }
        sanitizer.AllowedSchemes.Clear();
        foreach (string scheme in new[] { "https", "http", "mailto" })
        {
            sanitizer.AllowedSchemes.Add(scheme);
        }
        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedAtRules.Clear();
        return sanitizer;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPostPage
    // Method Description    :   One page of posts (drafts included) for the admin list, without bodies.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostPage : </c> One page of posts (drafts included) for the admin list, without bodies.
    /// </summary>
    public async Task<Response<object>> GetPostPage(GetAllPostsRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string status = (objAPIRequest.Status ?? "all").Trim().ToLowerInvariant();
            if (status is not ("all" or "published" or "draft"))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Status must be all, published or draft.";
                return objResponse;
            }
            (int page, int pageSize, int skip) = Paging.Normalize(objAPIRequest);
            string search = (objAPIRequest.Search ?? string.Empty).Trim();
            (List<PostDocument> posts, long total) = await postDAL.GetPostPageDB(status, search.Length > 100 ? search[..100] : search, skip, pageSize);
            List<PostListItemDTO> items = posts.Select(x => new PostListItemDTO
            {
                Id = x.Id,
                Title = x.Title,
                Category = x.Category,
                Tags = x.Tags,
                Date = x.Date,
                IsPublished = x.IsPublished,
                UpdatedAt = x.UpdatedAt,
            }).ToList();
            objResponse.Data = Paging.Result(items, page, pageSize, total);
            objResponse.RowCount = total;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPostPage", string.Empty, nameof(GetPostPage));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPostForEdit
    // Method Description    :   One post (draft or published) with its body, for the editor.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostForEdit : </c> One post (draft or published) with its body, for the editor.
    /// </summary>
    public async Task<Response<object>> GetPostForEdit(GetItemRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Id ?? string.Empty).Trim();
            PostDocument? post = slug.Length is > 0 and <= 96 ? await postDAL.GetPostDB(slug) : null;
            if (post == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Post not found.";
                return objResponse;
            }
            objResponse.Data = post;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPostForEdit", string.Empty, nameof(GetPostForEdit));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPostOptions
    // Method Description    :   Slug and title of every post, for the project editor’s picker.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetPostOptions : </c> Slug and title of every post, for the project editor’s picker.
    /// </summary>
    public async Task<Response<object>> GetPostOptions(EmptyRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<PostOptionDTO> options = (await postDAL.GetPostOptionsDB()).Select(x => new PostOptionDTO { Id = x.Id, Title = x.Title }).ToList();
            objResponse.Data = options;
            objResponse.RowCount = options.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPostOptions", string.Empty, nameof(GetPostOptions));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }
}
