using System.Text;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Tells live presence which posts readers may join
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Blog engagement: reads, reactions, comments and the most-read list. Built for heavy traffic: atomic counters, short in-memory caches for what every visitor sees, and no visitor identifiers stored.
 */
public partial class EngagementBAL(
    PostDAL postDAL,
    PostStatsDAL postStatsDAL,
    CommentDAL commentDAL,
    PageViewDAL pageViewDAL,
    NotificationBAL notificationBAL,
    AuditBAL auditBAL,
    IMemoryCache memoryCache,
    IContextService contextService,
    IOptions<PortfolioSettings> options,
    ICodeLogger codeLog)
{
    /// <summary>Reactions a reader can give.</summary>
    public static readonly string[] Reactions = ["like", "idea", "fire", "love"];

    private const int MaxNameLength = 60;
    private const int MaxBodyLength = 2000;
    private const int MaxPublicComments = 200;
    private const long MinFormMilliseconds = 3000;
    private static readonly TimeSpan EngagementCacheTime = TimeSpan.FromSeconds(15);
    private static readonly TimeSpan PopularCacheTime = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan PostsCacheTime = TimeSpan.FromMinutes(1);

    [GeneratedRegex(@"^/blog/([a-z0-9-]{1,120})$")]
    private static partial Regex BlogPath();

    [GeneratedRegex(@"https?://|www\.", RegexOptions.IgnoreCase)]
    private static partial Regex LinkPattern();

    [GeneratedRegex(@"\n{3,}")]
    private static partial Regex ExtraBlankLines();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPostEngagement
    // Method Description    :   Reads, reactions and approved comments for one published post (cached briefly).
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
    /// <c>GetPostEngagement : </c> Reads, reactions and approved comments for one published post (cached briefly).
    /// </summary>
    public async Task<Response<object>> GetPostEngagement(GetPostEngagementRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            if (!(await PublishedPosts()).ContainsKey(slug))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Post not found.";
                return objResponse;
            }
            objResponse.Data = await memoryCache.GetOrCreateAsync(EngagementKey(slug), async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = EngagementCacheTime;
                PostStatsDocument? stats = await postStatsDAL.GetStatsDB(slug);
                List<CommentDocument> comments = await commentDAL.GetApprovedCommentsDB(slug, MaxPublicComments);
                return new PostEngagementDTO
                {
                    Slug = slug,
                    Reads = stats?.Reads ?? 0,
                    Reactions = Reactions.ToDictionary(x => x, x => Math.Max(0, stats?.Reactions.GetValueOrDefault(x) ?? 0)),
                    Comments = comments.Select(x => new PublicCommentDTO { Id = x.Id, Name = x.Name, Body = x.Body, CreatedAt = x.CreatedAt }).ToList(),
                };
            });
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPostEngagement", string.Empty, nameof(GetPostEngagement));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ReactToPost
    // Method Description    :   Adds or takes back one reaction on a published post (an atomic counter; the browser remembers the reader’s choice).
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
    /// <c>ReactToPost : </c> Adds or takes back one reaction on a published post (an atomic counter; the browser remembers the reader’s choice).
    /// </summary>
    public async Task<Response<object>> ReactToPost(ReactToPostRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            string reaction = (objAPIRequest.Reaction ?? string.Empty).Trim().ToLowerInvariant();
            if (!Reactions.Contains(reaction))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Unknown reaction.";
                return objResponse;
            }
            if (!(await PublishedPosts()).ContainsKey(slug))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Post not found.";
                return objResponse;
            }
            await postStatsDAL.ChangeReactionDB(slug, reaction, objAPIRequest.IsAdded);
            memoryCache.Remove(EngagementKey(slug));
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Thanks!";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step ReactToPost", string.Empty, nameof(ReactToPost));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   AddComment
    // Method Description    :   Validates a reader comment and holds it for approval; likely spam is kept apart and bot submissions are dropped silently. Alerts the owner on Telegram.
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
    /// <c>AddComment : </c> Validates a reader comment and holds it for approval; likely spam is kept apart and bot submissions are dropped silently. Alerts the owner on Telegram.
    /// </summary>
    public async Task<Response<object>> AddComment(AddCommentRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            // Bots fill the hidden field or post instantly: answer as if accepted, store nothing.
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Thanks! Your comment will appear once it is approved.";
            if ((objAPIRequest.Website ?? string.Empty).Length > 0 || objAPIRequest.ElapsedMs < MinFormMilliseconds)
            {
                return objResponse;
            }
            string slug = (objAPIRequest.Slug ?? string.Empty).Trim();
            string name = CleanText(objAPIRequest.Name, isMultiline: false);
            string body = CleanText(objAPIRequest.Body, isMultiline: true);
            string error = name.Length is 0 or > MaxNameLength ? $"Please give a name of up to {MaxNameLength} characters."
                : body.Length < 2 ? "Please write a comment."
                : body.Length > MaxBodyLength ? $"Comments are limited to {MaxBodyLength:N0} characters."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            Dictionary<string, string> posts = await PublishedPosts();
            if (!posts.TryGetValue(slug, out string? title))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Post not found.";
                return objResponse;
            }
            bool isSpam = LinkPattern().Matches(body).Count > 2;
            CommentDocument comment = new CommentDocument
            {
                Slug = slug,
                Name = name,
                Body = body,
                Status = isSpam ? "spam" : "pending",
                Country = contextService.GetCountry(),
                CreatedAt = DateTime.UtcNow,
            };
            await commentDAL.InsertCommentDB(comment);
            if (!isSpam)
            {
                string excerpt = body.Length > 300 ? body[..300] + "…" : body;
                await notificationBAL.SendAlert(
                    $"💬 <b>New comment</b> on “{NotificationBAL.Escape(title)}”\nfrom <b>{NotificationBAL.Escape(name)}</b>\n\n{NotificationBAL.Escape(excerpt)}\n\nReview: https://{options.Value.Site.Host}/admin/comments");
            }
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step AddComment", string.Empty, nameof(AddComment));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetPopularPosts
    // Method Description    :   The most-read published posts with their reaction totals (cached for a few minutes).
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
    /// <c>GetPopularPosts : </c> The most-read published posts with their reaction totals (cached for a few minutes).
    /// </summary>
    public async Task<Response<object>> GetPopularPosts(GetPopularPostsRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            int limit = Math.Clamp(objAPIRequest.Limit, 1, 20);
            List<PopularPostDTO> popular = await memoryCache.GetOrCreateAsync("popular-posts", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PopularCacheTime;
                Dictionary<string, string> posts = await PublishedPosts();
                List<PostStatsDocument> top = await postStatsDAL.GetTopStatsDB(60);
                List<PopularPostDTO> list = top.Where(x => posts.ContainsKey(x.Id) && x.Reads > 0)
                    .Select(x => new PopularPostDTO { Slug = x.Id, Title = posts[x.Id], Reads = x.Reads, Reactions = x.Reactions.Values.Where(v => v > 0).Sum() })
                    .Take(20)
                    .ToList();
                // Nothing read yet (a new site): check again soon rather than in five minutes.
                if (list.Count == 0)
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30);
                }
                return list;
            }) ?? new List<PopularPostDTO>();
            objResponse.Data = popular.Take(limit).ToList();
            objResponse.RowCount = Math.Min(limit, popular.Count);
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetPopularPosts", string.Empty, nameof(GetPopularPosts));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetComments
    // Method Description    :   One page of comments for moderation, filtered by status and optional text.
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
    /// <c>GetComments : </c> One page of comments for moderation, filtered by status and optional text.
    /// </summary>
    public async Task<Response<object>> GetComments(GetCommentsRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string status = (objAPIRequest.Status ?? string.Empty).Trim().ToLowerInvariant();
            if (status == "all")
            {
                status = string.Empty;
            }
            if (status.Length > 0 && status is not ("pending" or "approved" or "spam"))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Unknown status.";
                return objResponse;
            }
            (int page, int pageSize, int skip) = Paging.Normalize(objAPIRequest);
            Dictionary<string, string> posts = await AllPostTitles();
            string search = (objAPIRequest.Search ?? string.Empty).Trim();
            search = search.Length > 100 ? search[..100] : search;
            long total = await commentDAL.CountCommentsDB(status, search);
            List<CommentDocument> comments = await commentDAL.GetCommentsDB(status, search, skip, pageSize);
            List<AdminCommentDTO> items = comments.Select(x => new AdminCommentDTO
            {
                Id = x.Id,
                Slug = x.Slug,
                PostTitle = posts.GetValueOrDefault(x.Slug, x.Slug),
                Name = x.Name,
                Body = x.Body,
                Status = x.Status,
                Country = x.Country,
                CreatedAt = x.CreatedAt,
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
            codeLog.Error(ex, "Step GetComments", string.Empty, nameof(GetComments));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ModerateComment
    // Method Description    :   Approves or deletes a comment, and records it in the audit log.
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
    /// <c>ModerateComment : </c> Approves or deletes a comment, and records it in the audit log.
    /// </summary>
    public async Task<Response<object>> ModerateComment(ModerateCommentRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string action = (objAPIRequest.Action ?? string.Empty).Trim().ToLowerInvariant();
            if (action is not ("approve" or "delete"))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Action must be approve or delete.";
                return objResponse;
            }
            CommentDocument? comment = await commentDAL.GetCommentDB((objAPIRequest.Id ?? string.Empty).Trim());
            if (comment == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Comment not found.";
                return objResponse;
            }
            bool isDone = action == "approve" ? await commentDAL.ApproveCommentDB(comment.Id) : await commentDAL.DeleteCommentDB(comment.Id);
            memoryCache.Remove(EngagementKey(comment.Slug));
            await auditBAL.Write($"comment.{action}", isDone, contextService.GetUserId(), contextService.GetEmail(), $"{comment.Slug}/{comment.Id}");
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = action == "approve" ? "Comment approved." : "Comment deleted.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step ModerateComment", string.Empty, nameof(ModerateComment));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   RecordRead
    // Method Description    :   Adds a read to a published post when a tracked page view is one of its pages.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   path
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RecordRead : </c> Adds a read to a published post when a tracked page view is one of its pages.
    /// </summary>
    public async Task RecordRead(string path)
    {
        Match match = BlogPath().Match(path);
        if (match.Success && (await PublishedPosts()).ContainsKey(match.Groups[1].Value))
        {
            await postStatsDAL.IncrementReadDB(match.Groups[1].Value);
        }
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   BackfillReads
    // Method Description    :   Once, before any counters exist: seeds read counts from the page views still stored.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>BackfillReads : </c> Once, before any counters exist: seeds read counts from the page views still stored.
    /// </summary>
    public async Task BackfillReads()
    {
        if (await postStatsDAL.HasAnyStatsDB())
        {
            return;
        }
        Dictionary<string, string> posts = await PublishedPosts();
        foreach (CountItemDTO row in await pageViewDAL.GetBlogReadCountsDB())
        {
            Match match = BlogPath().Match(row.Key);
            if (match.Success && posts.ContainsKey(match.Groups[1].Value))
            {
                await postStatsDAL.SetReadsDB(match.Groups[1].Value, row.Count);
            }
        }
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   IsPublishedPost
    // Method Description    :   Whether a slug is a published post (from the one-minute cache), for live presence.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>IsPublishedPost : </c> Whether a slug is a published post (from the one-minute cache), for live presence.
    /// </summary>
    public async Task<bool> IsPublishedPost(string slug)
    {
        return (await PublishedPosts()).ContainsKey(slug);
    }

    /// <summary>Slug to title for published posts, cached for a minute (checked on every engagement call).</summary>
    private async Task<Dictionary<string, string>> PublishedPosts()
    {
        return await memoryCache.GetOrCreateAsync("published-posts", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = PostsCacheTime;
            return (await postDAL.GetPostsDB(true)).ToDictionary(x => x.Id, x => x.Title);
        }) ?? new Dictionary<string, string>();
    }

    /// <summary>Slug to title for every post, published or not (admin only, not cached).</summary>
    private async Task<Dictionary<string, string>> AllPostTitles()
    {
        return (await postDAL.GetPostsDB(false)).ToDictionary(x => x.Id, x => x.Title);
    }

    private static string EngagementKey(string slug)
    {
        return $"engagement:{slug}";
    }

    /// <summary>Trims, drops control characters (keeping line breaks in a comment) and collapses runs of blank lines.</summary>
    private static string CleanText(string? value, bool isMultiline)
    {
        StringBuilder builder = new StringBuilder();
        foreach (char c in (value ?? string.Empty).Replace("\r\n", "\n"))
        {
            if (c == '\n' && isMultiline)
            {
                builder.Append(c);
            }
            else if (!char.IsControl(c))
            {
                builder.Append(c);
            }
        }
        string text = builder.ToString().Trim();
        return isMultiline ? ExtraBlankLines().Replace(text, "\n\n") : string.Join(' ', text.Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}
