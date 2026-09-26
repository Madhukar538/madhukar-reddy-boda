using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Writes security and content audit entries and serves the audit log.
 */
public class AuditBAL(AuditDAL auditDAL, IContextService contextService, ICodeLogger codeLog)
{
    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Write
    // Method Description    :   Records an audit entry; failures are logged, never thrown, so auditing can't break a request.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   action, isSuccess, userId, email, detail
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Write : </c> Records an audit entry; failures are logged, never thrown, so auditing can't break a request.
    /// </summary>
    public async Task Write(string action, bool isSuccess, string userId, string email, string detail)
    {
        try
        {
            await auditDAL.InsertAuditDB(new AuditLogDocument
            {
                At = DateTime.UtcNow,
                Action = action,
                IsSuccess = isSuccess,
                UserId = userId,
                Email = email,
                IpAddress = contextService.GetClientIp(),
                UserAgent = contextService.GetUserAgent(),
                Detail = detail.Length > 256 ? detail[..256] : detail,
            });
        }
        catch (Exception ex)
        {
            codeLog.Error(ex, "Step Audit", action, nameof(Write));
        }
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetAuditLog
    // Method Description    :   Returns the latest audit entries.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetAuditLog : </c> Returns the latest audit entries.
    /// </summary>
    public async Task<Response<object>> GetAuditLog(GetAuditLogRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            int limit = objAPIRequest.Limit is >= 1 and <= 200 ? objAPIRequest.Limit : 50;
            List<AuditLogDocument> entries = await auditDAL.GetAuditLogDB(limit);
            objResponse.Data = entries;
            objResponse.RowCount = entries.Count;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetAuditLog", string.Empty, nameof(GetAuditLog));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }
}
