using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  The public bug log per site: read by anyone, saved whole by the admin after each entry's fields are
 *                    checked; saving refreshes the pages that show it.
 */
public class BugLogBAL(BugLogDAL bugLogDAL, RevalidationBAL revalidationBAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    /// <summary>Most entries kept.</summary>
    public const int MaxEntries = 100;

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetBugLog
    // Method Description    :   The site's bug log, newest first (empty until one is saved).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetBugLog : </c> The site's bug log, newest first (empty until one is saved).
    /// </summary>
    public async Task<Response<object>> GetBugLog()
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            BugLogDocument? bugLog = await bugLogDAL.GetBugLogDB();
            objResponse.Data = new BugLogDTO
            {
                Entries = (bugLog?.Entries ?? new()).Select(ToDTO).ToList(),
                UpdatedAt = bugLog?.UpdatedAt,
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Bug log.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetBugLog", string.Empty, nameof(GetBugLog));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   SaveBugLog
    // Method Description    :   Saves the whole bug log after checking each entry's required fields and lengths, then refreshes the pages that show it.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SaveBugLog : </c> Saves the whole bug log after checking each entry's required fields and lengths, then refreshes the pages that show it.
    /// </summary>
    public async Task<Response<object>> SaveBugLog(SaveBugLogRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            List<BugEntryDTO> entries = objAPIRequest.Entries ?? new();
            string error = Check(entries);
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            await bugLogDAL.UpsertBugLogDB(new BugLogDocument
            {
                Entries = entries.Select(ToDocument).ToList(),
                UpdatedAt = DateTime.UtcNow,
            });
            bool isRevalidated = await revalidationBAL.Revalidate(["bugLog"]);
            await auditBAL.Write("bugLog.saved", true, contextService.GetUserId(), contextService.GetEmail(), $"{entries.Count} entries");
            objResponse.Data = new SaveResultDTO { Id = BugLogDocument.DocumentId, IsRevalidated = isRevalidated };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Bug log saved.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step SaveBugLog", string.Empty, nameof(SaveBugLog));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>Why the log can't be saved, or empty: too many entries, a required field missing, or a field too long.</summary>
    private static string Check(List<BugEntryDTO> entries)
    {
        if (entries.Count > MaxEntries)
        {
            return $"The bug log is limited to {MaxEntries} entries.";
        }
        for (int i = 0; i < entries.Count; i++)
        {
            BugEntryDTO entry = entries[i] ?? new BugEntryDTO();
            (string Name, string Value, int Max, bool IsRequired)[] fields =
            [
                ("title", entry.Title, 120, true),
                ("date", entry.When, 40, true),
                ("stack", entry.Stack, 80, false),
                ("symptom", entry.Symptom, 800, true),
                ("cause", entry.Cause, 800, true),
                ("fix", entry.Fix, 800, true),
                ("result", entry.Result, 200, false),
            ];
            foreach ((string name, string value, int max, bool isRequired) in fields)
            {
                string text = (value ?? string.Empty).Trim();
                if (isRequired && text.Length == 0)
                {
                    return $"Entry {i + 1} needs a {name}.";
                }
                if (text.Length > max)
                {
                    return $"Entry {i + 1}: the {name} is limited to {max} characters.";
                }
            }
        }
        return string.Empty;
    }

    private static BugEntryDTO ToDTO(BugEntryDocument x) => new()
    {
        Title = x.Title,
        When = x.When,
        Stack = x.Stack,
        Symptom = x.Symptom,
        Cause = x.Cause,
        Fix = x.Fix,
        Result = x.Result,
    };

    private static BugEntryDocument ToDocument(BugEntryDTO x) => new()
    {
        Title = (x.Title ?? string.Empty).Trim(),
        When = (x.When ?? string.Empty).Trim(),
        Stack = (x.Stack ?? string.Empty).Trim(),
        Symptom = (x.Symptom ?? string.Empty).Trim(),
        Cause = (x.Cause ?? string.Empty).Trim(),
        Fix = (x.Fix ?? string.Empty).Trim(),
        Result = (x.Result ?? string.Empty).Trim(),
    };
}
