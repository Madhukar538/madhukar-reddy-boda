using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Api.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Services
 * Modified By     :
 * Description     :  Fails startup when security-critical settings are missing or weak.
 */
public class PortfolioSettingsValidator : IValidateOptions<PortfolioSettings>
{
    //****************************************************************************************************
    // Layer                 :   Services
    // Method Name           :   Validate
    // Method Description    :   Checks keys, secrets, origins and the database connection.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   name, options
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   ValidateOptionsResult
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Validate : </c> Checks keys, secrets, origins and the database connection.
    /// </summary>
    public ValidateOptionsResult Validate(string? name, PortfolioSettings options)
    {
        List<string> failures = new List<string>();
        if (string.IsNullOrWhiteSpace(options.Mongo.ConnectionString))
        {
            failures.Add("Portfolio:Mongo:ConnectionString is required.");
        }
        if (Base64Length(options.Security.JwtSigningKey) < 32)
        {
            failures.Add("Portfolio:Security:JwtSigningKey must be at least 32 random bytes, base64-encoded.");
        }
        if (Base64Length(options.Security.EncryptionKey) != 32)
        {
            failures.Add("Portfolio:Security:EncryptionKey must be exactly 32 random bytes, base64-encoded.");
        }
        if (options.Security.SetupToken.Length is > 0 and < 32)
        {
            failures.Add("Portfolio:Security:SetupToken must be at least 32 characters (or empty to disable setup).");
        }
        if (options.Security.AllowedOrigins.Count == 0 || options.Security.AllowedOrigins.Any(x => x == "*" || !Uri.TryCreate(x, UriKind.Absolute, out _)))
        {
            failures.Add("Portfolio:Security:AllowedOrigins must list explicit origins (no wildcard).");
        }
        if (string.IsNullOrWhiteSpace(options.Passkeys.RpId) || options.Passkeys.Origins.Count == 0)
        {
            failures.Add("Portfolio:Passkeys:RpId and Origins are required.");
        }
        if (options.Site.RevalidateUrl.Length > 0 && options.Site.RevalidateSecret.Length < 32)
        {
            failures.Add("Portfolio:Site:RevalidateSecret must be at least 32 characters when RevalidateUrl is set.");
        }
        if (options.Security.AccessTokenMinutes is < 1 or > 60 || options.Security.RefreshTokenDays is < 1 or > 30)
        {
            failures.Add("Token lifetimes must be 1-60 minutes (access) and 1-30 days (refresh).");
        }
        return failures.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(failures);
    }

    private static int Base64Length(string value)
    {
        try
        {
            return Convert.FromBase64String(value).Length;
        }
        catch (FormatException)
        {
            return 0;
        }
    }
}
