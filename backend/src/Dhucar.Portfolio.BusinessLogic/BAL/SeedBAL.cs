using System.Globalization;
using System.Text.Json;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
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
        string path = options.Value.SeedPath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            codeLog.Code("Seed", "No seed file; skipping.");
            return;
        }
        SeedFile? seed = JsonSerializer.Deserialize<SeedFile>(await File.ReadAllTextAsync(path), JsonOptions);
        if (seed == null)
        {
            return;
        }
        if (await postDAL.CountPostsDB() == 0)
        {
            await postDAL.InsertPostsDB(seed.Posts.Select(x => new PostDocument
            {
                Id = x.Slug,
                Title = x.Title,
                Excerpt = x.Excerpt,
                Content = PostBAL.SanitizeHtml(x.Content),
                Date = x.Date,
                PublishedAt = DateTime.ParseExact(x.Date, "MMMM d, yyyy", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal),
                Category = x.Category,
                Tags = x.Tags,
                IsPublished = true,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = "seed",
            }).ToList());
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

    private sealed class SeedFile
    {
        public List<SeedPost> Posts { get; set; } = new();

        public List<ProjectDocument> Projects { get; set; } = new();

        public ProfileDocument? Profile { get; set; }
    }

    private sealed class SeedPost
    {
        public string Slug { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Excerpt { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public string Date { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public List<string> Tags { get; set; } = new();
    }
}
