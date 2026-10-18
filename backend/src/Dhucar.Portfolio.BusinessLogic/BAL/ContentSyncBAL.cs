using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Profile sync also covers the GitHub and LinkedIn links (Twitter is no longer used)
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Compares the deployed built-in content (seed file) with the database and applies the
 *                    differences the admin chooses: new posts and projects, and updates to changed ones.
 */
public class ContentSyncBAL(
    SeedBAL seedBAL,
    PostDAL postDAL,
    ProjectDAL projectDAL,
    ProfileDAL profileDAL,
    RevalidationBAL revalidationBAL,
    AuditBAL auditBAL,
    IContextService contextService,
    ICodeLogger codeLog)
{
    private const int MaxItems = 200;
    private static readonly string[] Types = ["post", "project", "profile"];

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetContentSync
    // Method Description    :   Lists what is new or changed in the built-in content compared with the database.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetContentSync : </c> Lists what is new or changed in the built-in content compared with the database.
    /// </summary>
    public async Task<Response<object>> GetContentSync()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            SeedContentDTO? seed = await seedBAL.ReadSeed();
            if (seed == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "No built-in content file on the server.";
                return objResponse;
            }
            List<ContentSyncItemDTO> items = await Compare(seed);
            objResponse.Data = items;
            objResponse.RowCount = items.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetContentSync", string.Empty, nameof(GetContentSync));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ApplyContentSync
    // Method Description    :   Adds or updates the chosen items from the built-in content, then refreshes the site.
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
    /// <c>ApplyContentSync : </c> Adds or updates the chosen items from the built-in content, then refreshes the site.
    /// </summary>
    public async Task<Response<object>> ApplyContentSync(ApplyContentSyncRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<ContentSyncSelectionDTO> selected = objAPIRequest.Items ?? new List<ContentSyncSelectionDTO>();
            if (selected.Count == 0 || selected.Count > MaxItems || selected.Any(x => !Types.Contains(x.Type)))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Choose between 1 and 200 items to sync.";
                return objResponse;
            }
            SeedContentDTO? seed = await seedBAL.ReadSeed();
            if (seed == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "No built-in content file on the server.";
                return objResponse;
            }

            // Only items that still differ are applied, so a stale screen can't overwrite anything twice.
            HashSet<string> pending = (await Compare(seed)).Select(x => Key(x.Type, x.Id)).ToHashSet();
            HashSet<string> wanted = selected.Select(x => Key(x.Type, x.Id)).Where(pending.Contains).ToHashSet();
            List<string> tags = new List<string>();
            int applied = 0;

            foreach (SeedPostDTO seedPost in seed.Posts.Where(x => wanted.Contains(Key("post", x.Slug))))
            {
                PostDocument post = SeedBAL.ToPostDocument(seedPost);
                PostDocument? existing = await postDAL.GetPostDB(seedPost.Slug);
                if (existing != null)
                {
                    post.IsPublished = existing.IsPublished;
                }
                post.UpdatedBy = contextService.GetEmail();
                await postDAL.UpsertPostDB(post);
                tags.Add($"post:{post.Id}");
                applied++;
            }
            if (applied > 0)
            {
                tags.Add("posts");
            }

            int projectsApplied = 0;
            foreach (ProjectDocument seedProject in seed.Projects.Where(x => wanted.Contains(Key("project", x.Id))))
            {
                ProjectDocument? existing = await projectDAL.GetProjectDB(seedProject.Id);
                seedProject.IsPublished = existing?.IsPublished ?? true;
                seedProject.SortOrder = existing?.SortOrder ?? seedProject.SortOrder;
                seedProject.UpdatedAt = DateTime.UtcNow;
                await projectDAL.UpsertProjectDB(seedProject);
                projectsApplied++;
            }
            if (projectsApplied > 0)
            {
                tags.Add("projects");
                applied += projectsApplied;
            }

            if (seed.Profile != null && wanted.Contains(Key("profile", "profile")))
            {
                ProfileDocument? profile = await profileDAL.GetProfileDB();
                if (profile != null)
                {
                    // Only the skill groups and profile links: contact details and the rest stay as edited in the admin.
                    profile.SkillCategories = seed.Profile.SkillCategories;
                    profile.Github = seed.Profile.Github;
                    profile.Linkedin = seed.Profile.Linkedin;
                    profile.Twitter = string.Empty;
                    profile.UpdatedAt = DateTime.UtcNow;
                    await profileDAL.UpsertProfileDB(profile);
                    tags.Add("profile");
                    applied++;
                }
            }

            bool isRevalidated = tags.Count == 0 || await revalidationBAL.Revalidate(tags);
            await auditBAL.Write("content.synced", true, contextService.GetUserId(), contextService.GetEmail(), string.Join(", ", wanted));
            objResponse.Data = new ContentSyncResultDTO { Applied = applied, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = applied == 1 ? "1 item synced." : $"{applied} items synced.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step ApplyContentSync", string.Empty, nameof(ApplyContentSync));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    private async Task<List<ContentSyncItemDTO>> Compare(SeedContentDTO seed)
    {
        List<ContentSyncItemDTO> items = new List<ContentSyncItemDTO>();

        Dictionary<string, PostDocument> posts = (await postDAL.GetPostsDB(false)).ToDictionary(x => x.Id);
        foreach (SeedPostDTO seedPost in seed.Posts)
        {
            if (!posts.TryGetValue(seedPost.Slug, out PostDocument? post))
            {
                items.Add(new ContentSyncItemDTO { Type = "post", Id = seedPost.Slug, Title = seedPost.Title, Change = "new" });
                continue;
            }
            List<string> fields = new List<string>();
            Check(fields, "title", seedPost.Title, post.Title);
            Check(fields, "excerpt", seedPost.Excerpt, post.Excerpt);
            Check(fields, "content", PostBAL.SanitizeHtml(seedPost.Content), post.Content);
            Check(fields, "date", seedPost.Date, post.Date);
            Check(fields, "category", seedPost.Category, post.Category);
            Check(fields, "tags", seedPost.Tags, post.Tags);
            if (fields.Count > 0)
            {
                items.Add(new ContentSyncItemDTO { Type = "post", Id = seedPost.Slug, Title = seedPost.Title, Change = "changed", Fields = fields });
            }
        }

        Dictionary<string, ProjectDocument> projects = (await projectDAL.GetProjectsDB(string.Empty, false)).ToDictionary(x => x.Id);
        foreach (ProjectDocument seedProject in seed.Projects)
        {
            if (!projects.TryGetValue(seedProject.Id, out ProjectDocument? project))
            {
                items.Add(new ContentSyncItemDTO { Type = "project", Id = seedProject.Id, Title = seedProject.Title, Change = "new" });
                continue;
            }
            List<string> fields = new List<string>();
            Check(fields, "title", seedProject.Title, project.Title);
            Check(fields, "description", seedProject.Description, project.Description);
            Check(fields, "tech", seedProject.Tech, project.Tech);
            Check(fields, "post", seedProject.Post, project.Post);
            Check(fields, "outcome", seedProject.Outcome, project.Outcome);
            Check(fields, "status", seedProject.Status, project.Status);
            Check(fields, "client", seedProject.Client, project.Client);
            Check(fields, "role", seedProject.Role, project.Role);
            Check(fields, "duration", seedProject.Duration, project.Duration);
            Check(fields, "url", seedProject.Url, project.Url);
            Check(fields, "responsibilities", seedProject.Responsibilities, project.Responsibilities);
            if (seedProject.IsFeatured != project.IsFeatured)
            {
                fields.Add("featured");
            }
            if (fields.Count > 0)
            {
                items.Add(new ContentSyncItemDTO { Type = "project", Id = seedProject.Id, Title = seedProject.Title, Change = "changed", Fields = fields });
            }
        }

        ProfileDocument? profile = await profileDAL.GetProfileDB();
        if (seed.Profile != null && profile != null)
        {
            List<string> fields = new List<string>();
            if (!SameSkills(seed.Profile.SkillCategories, profile.SkillCategories))
            {
                fields.Add("skills");
            }
            Check(fields, "github", seed.Profile.Github, profile.Github);
            Check(fields, "linkedin", seed.Profile.Linkedin, profile.Linkedin);
            Check(fields, "twitter", string.Empty, profile.Twitter);
            if (fields.Count > 0)
            {
                items.Add(new ContentSyncItemDTO { Type = "profile", Id = "profile", Title = "Profile (skills and links)", Change = "changed", Fields = fields });
            }
        }
        return items;
    }

    private static string Key(string type, string id) => $"{type}:{id}";

    private static void Check(List<string> fields, string name, string? seed, string? current)
    {
        if (!string.Equals((seed ?? string.Empty).Trim(), (current ?? string.Empty).Trim(), StringComparison.Ordinal))
        {
            fields.Add(name);
        }
    }

    private static void Check(List<string> fields, string name, List<string>? seed, List<string>? current)
    {
        if (!(seed ?? new List<string>()).SequenceEqual(current ?? new List<string>()))
        {
            fields.Add(name);
        }
    }

    private static bool SameSkills(List<SkillCategoryItem> seed, List<SkillCategoryItem> current) =>
        seed.Count == current.Count
        && seed.Zip(current).All(pair => pair.First.Title == pair.Second.Title && pair.First.Skills.SequenceEqual(pair.Second.Skills));
}
