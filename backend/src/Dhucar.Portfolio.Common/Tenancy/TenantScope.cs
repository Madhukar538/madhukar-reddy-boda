namespace Dhucar.Portfolio.Common.Tenancy;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  17 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  The site (tenant) the current request or background job works for. Each site has its own
 *                    MongoDB database, so MongoContext reads this to pick the database. Nothing set means the
 *                    primary site (dhucar.in), whose database is the configured one: single-site behaviour unchanged.
 */
public static class TenantScope
{
    /// <summary>Slug of the primary site, served from the configured database.</summary>
    public const string PrimarySlug = "main";

    private static readonly AsyncLocal<TenantInfo?> _current = new();

    /// <summary>The site for this flow of work, or null for the primary site.</summary>
    public static TenantInfo? Current => _current.Value;

    /// <summary>The current site's slug ("main" for the primary site).</summary>
    public static string Slug => _current.Value?.Slug ?? PrimarySlug;

    /// <summary>True for the primary site.</summary>
    public static bool IsPrimary => Slug == PrimarySlug;

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Use
    // Method Description    :   Works for the given site until the returned handle is disposed (then the previous site again).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   tenant
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   IDisposable
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Use : </c> Works for the given site until the returned handle is disposed (then the previous site again).
    /// </summary>
    public static IDisposable Use(TenantInfo? tenant)
    {
        TenantInfo? previous = _current.Value;
        _current.Value = tenant;
        return new Restore(previous);
    }

    private sealed class Restore(TenantInfo? previous) : IDisposable
    {
        private bool _isDisposed;

        public void Dispose()
        {
            if (_isDisposed)
            {
                return;
            }
            _isDisposed = true;
            _current.Value = previous;
        }
    }
}

