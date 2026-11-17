using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  The site registry: finding a site by slug or host, listing active sites and adding one.
 */
public class TenantDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetTenantDB
    // Method Description    :   One site by slug, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   slug
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   TenantDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTenantDB : </c> One site by slug, or null.
    /// </summary>
    public async Task<TenantDocument?> GetTenantDB(string slug)
    {
        return await context.Tenants.Find(x => x.Id == slug).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetTenantByHostDB
    // Method Description    :   The site a host name belongs to, or null.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   host
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   TenantDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTenantByHostDB : </c> The site a host name belongs to, or null.
    /// </summary>
    public async Task<TenantDocument?> GetTenantByHostDB(string host)
    {
        return await context.Tenants.Find(Builders<TenantDocument>.Filter.AnyEq(x => x.Hosts, host)).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetActiveTenantsDB
    // Method Description    :   Every active site, for start-up work such as indexes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   List of TenantDocument
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetActiveTenantsDB : </c> Every active site, for start-up work such as indexes.
    /// </summary>
    public async Task<List<TenantDocument>> GetActiveTenantsDB()
    {
        return await context.Tenants.Find(x => x.Status == "active").ToListAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertTenantDB
    // Method Description    :   Adds a site; returns false when the slug or one of its hosts is taken.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   tenant
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertTenantDB : </c> Adds a site; returns false when the slug or one of its hosts is taken.
    /// </summary>
    public async Task<bool> InsertTenantDB(TenantDocument tenant)
    {
        try
        {
            await context.Tenants.InsertOneAsync(tenant);
            return true;
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return false;
        }
    }
}
