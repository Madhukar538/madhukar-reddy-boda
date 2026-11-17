using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  14 Nov 2026
 * Modified Date   :  17 Nov 2026
 * Modified Reason :  Blueprint and Editorial themes added to the registry
 * Layer           :  BusinessLogic
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  The theme registry, and which themes are enabled and the default (set in the admin).
 */
public class ThemeBAL(ThemeDAL themeDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    /// <summary>
    /// Every theme the site has styles for, in picker order. A theme is added here and in the
    /// site's CSS (html[data-style='id']); the admin then enables it and can make it the default.
    /// </summary>
    public static readonly IReadOnlyList<(string Id, string Label, string Hint)> Registry =
    [
        ("terminal", "Terminal", "Light"),
        ("midnight", "Midnight", "Warm dark"),
        ("blueprint", "Blueprint", "Interactive"),
        ("editorial", "Editorial", "Kinetic type"),
        ("glass", "Glass", "Liquid glass"),
        ("arctic", "Arctic", "Cool light"),
        ("synthwave", "Synthwave", "Neon dark"),
        ("dune", "Dune", "Warm serif"),
        ("gazette", "Gazette", "Newspaper"),
        ("receipt", "Receipt", "Till slip"),
        ("observatory", "Observatory", "Star atlas"),
    ];

    /// <summary>Used until an admin saves the settings: Terminal by default, every theme enabled.</summary>
    public const string FallbackDefault = "terminal";

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetThemes
    // Method Description    :   Returns every registered theme with the enabled ones and the default marked.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   14 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response<object> with ThemeSettingsDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    14 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetThemes : </c> Returns every registered theme with the enabled ones and the default marked.
    /// </summary>
    public async Task<Response<object>> GetThemes()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            objResponse.Data = Resolve(await themeDAL.GetThemeSettingsDB());
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Themes.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetThemes", string.Empty, nameof(GetThemes));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SaveThemes
    // Method Description    :   Sets the enabled themes and the default, then refreshes the site.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   14 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response<object> with ThemeSettingsDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    14 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SaveThemes : </c> Sets the enabled themes and the default, then refreshes the site.
    /// </summary>
    public async Task<Response<object>> SaveThemes(SaveThemesRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<string> enabled = Registry.Select(t => t.Id).Where(id => objAPIRequest.EnabledThemes.Contains(id)).ToList();
            string error = objAPIRequest.EnabledThemes.Any(id => !Registry.Any(t => t.Id == id)) ? "Unknown theme."
                : enabled.Count == 0 ? "Enable at least one theme."
                : !enabled.Contains(objAPIRequest.DefaultTheme) ? "The default theme must be enabled."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            ThemeSettingsDocument settings = new ThemeSettingsDocument
            {
                DefaultTheme = objAPIRequest.DefaultTheme,
                EnabledThemes = enabled,
                UpdatedAt = DateTime.UtcNow,
            };
            await themeDAL.UpsertThemeSettingsDB(settings);
            bool isRevalidated = await revalidationBAL.Revalidate(["themes"]);
            await auditBAL.Write("themes.saved", true, contextService.GetUserId(), contextService.GetEmail(), $"default={settings.DefaultTheme}; enabled={string.Join(",", enabled)}");
            objResponse.Data = new SaveResultDTO { Id = ThemeSettingsDocument.DocumentId, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Themes saved.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SaveThemes", string.Empty, nameof(SaveThemes));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>Merges the saved settings with the registry; a theme removed from the registry is dropped.</summary>
    public static ThemeSettingsDTO Resolve(ThemeSettingsDocument? settings)
    {
        List<string> enabled = settings == null
            ? Registry.Select(t => t.Id).ToList()
            : Registry.Select(t => t.Id).Where(settings.EnabledThemes.Contains).ToList();
        if (enabled.Count == 0)
        {
            enabled.Add(FallbackDefault);
        }
        string fallback = enabled.Contains(FallbackDefault) ? FallbackDefault : enabled[0];
        string defaultTheme = settings != null && enabled.Contains(settings.DefaultTheme) ? settings.DefaultTheme : fallback;
        return new ThemeSettingsDTO
        {
            DefaultTheme = defaultTheme,
            Themes = Registry.Select(t => new ThemeItemDTO
            {
                Id = t.Id,
                Label = t.Label,
                Hint = t.Hint,
                IsEnabled = enabled.Contains(t.Id),
                IsDefault = t.Id == defaultTheme,
            }).ToList(),
        };
    }
}
