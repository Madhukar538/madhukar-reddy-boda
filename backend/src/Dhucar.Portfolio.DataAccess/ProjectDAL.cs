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
 * Description     :  Project storage (key, client and lab).
 */
public class ProjectDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetProjectsDB
    // Method Description    :   Lists projects of a kind (or all), in display order.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   kind, isPublishedOnly
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of ProjectDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetProjectsDB : </c> Lists projects of a kind (or all), in display order.
    /// </summary>
    public async Task<List<ProjectDocument>> GetProjectsDB(string kind, bool isPublishedOnly)
    {
        FilterDefinitionBuilder<ProjectDocument> builder = Builders<ProjectDocument>.Filter;
        FilterDefinition<ProjectDocument> filter = builder.Empty;
        if (kind.Length > 0)
        {
            filter &= builder.Eq(x => x.Kind, kind);
        }
        if (isPublishedOnly)
        {
            filter &= builder.Eq(x => x.IsPublished, true);
        }
        return await context.Projects.Find(filter).SortBy(x => x.Kind).ThenBy(x => x.SortOrder).ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetProjectDB
    // Method Description    :   Finds a project by id.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   projectId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   ProjectDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetProjectDB : </c> Finds a project by id.
    /// </summary>
    public async Task<ProjectDocument?> GetProjectDB(string projectId)
    {
        return await context.Projects.Find(x => x.Id == projectId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   UpsertProjectDB
    // Method Description    :   Inserts or replaces a project.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   project
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpsertProjectDB : </c> Inserts or replaces a project.
    /// </summary>
    public async Task UpsertProjectDB(ProjectDocument project)
    {
        await context.Projects.ReplaceOneAsync(x => x.Id == project.Id, project, new ReplaceOptions { IsUpsert = true });
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeleteProjectDB
    // Method Description    :   Deletes a project.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   projectId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteProjectDB : </c> Deletes a project.
    /// </summary>
    public async Task<bool> DeleteProjectDB(string projectId)
    {
        return (await context.Projects.DeleteOneAsync(x => x.Id == projectId)).DeletedCount == 1;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   CountProjectsDB
    // Method Description    :   Counts projects.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CountProjectsDB : </c> Counts projects.
    /// </summary>
    public async Task<long> CountProjectsDB()
    {
        return await context.Projects.CountDocumentsAsync(FilterDefinition<ProjectDocument>.Empty);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertProjectsDB
    // Method Description    :   Bulk-inserts projects (seeding).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   projects
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertProjectsDB : </c> Bulk-inserts projects (seeding).
    /// </summary>
    public async Task InsertProjectsDB(List<ProjectDocument> projects)
    {
        if (projects.Count > 0)
        {
            await context.Projects.InsertManyAsync(projects);
        }
    }
}
