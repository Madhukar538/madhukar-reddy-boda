using System.Globalization;
using System.Text.Json;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  18 Oct 2026
 * Modified Reason :  Shares the seed reader with the admin content sync
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  Imports the site's current content (exported to JSON) into an empty database, once.
 */
public class SeedBAL(PostDAL postDAL, ProjectDAL projectDAL, ProfileDAL profileDAL, IOptions<PortfolioSettings> options, ICodeLogger codeLog)
{
    private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SeedIfEmpty
    // Method Description    :   Imports posts, projects and profile for whichever collections are still empty; never overwrites.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SeedIfEmpty : </c> Imports posts, projects and profile for whichever collections are still empty; never overwrites.
    /// </summary>
    public async Task SeedIfEmpty()
    {
        SeedContentDTO? seed = await ReadSeed();
        if (seed == null)
        {
            codeLog.Code("Seed", "No seed file; skipping.");
            return;
        }
        if (await postDAL.CountPostsDB() == 0)
        {
            await postDAL.InsertPostsDB(seed.Posts.Select(ToPostDocument).ToList());
        }
        if (await projectDAL.CountProjectsDB() == 0)
        {
            foreach (ProjectDocument project in seed.Projects)
            {
                project.IsPublished = true;
                project.UpdatedAt = DateTime.UtcNow;
            }
            await projectDAL.InsertProjectsDB(seed.Projects);
        }
        if (seed.Profile != null && await profileDAL.GetProfileDB() == null)
        {
            seed.Profile.UpdatedAt = DateTime.UtcNow;
            await profileDAL.UpsertProfileDB(seed.Profile);
        }
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ReadSeed
    // Method Description    :   Reads the deployed seed file, or null when there is none.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   SeedContentDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ReadSeed : </c> Reads the deployed seed file, or null when there is none.
    /// </summary>
    public async Task<SeedContentDTO?> ReadSeed()
    {
        string path = options.Value.SeedPath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return null;
        }
        return JsonSerializer.Deserialize<SeedContentDTO>(await File.ReadAllTextAsync(path), JsonOptions);
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   ToPostDocument
    // Method Description    :   Converts a seed post into a published, sanitised post document.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   post
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PostDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ToPostDocument : </c> Converts a seed post into a published, sanitised post document.
    /// </summary>
    public static PostDocument ToPostDocument(SeedPostDTO post) => new PostDocument
    {
        Id = post.Slug,
        Title = post.Title,
        Excerpt = post.Excerpt,
        Content = PostBAL.SanitizeHtml(post.Content),
        Date = post.Date,
        PublishedAt = DateTime.ParseExact(post.Date, "MMMM d, yyyy", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal),
        Category = post.Category,
        Tags = post.Tags,
        IsPublished = true,
        UpdatedAt = DateTime.UtcNow,
        UpdatedBy = "seed",
    };
}
