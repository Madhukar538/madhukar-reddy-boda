using Microsoft.Extensions.Logging;

namespace Dhucar.Portfolio.Common.Logging;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Buffered, request-scoped logger: checkpoints are kept in memory and written only with an error, so normal requests pay no logging I/O.
 */
public class CodeLogger(ILogger<CodeLogger> logger) : ICodeLogger
{
    private readonly List<string> _steps = new();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Code
    // Method Description    :   Buffers a checkpoint for this request.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   step, message
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Code : </c> Buffers a checkpoint for this request.
    /// </summary>
    public void Code(string step, string message)
    {
        if (_steps.Count < 50)
        {
            _steps.Add($"{DateTime.UtcNow:HH:mm:ss.fff} {step}: {message}");
        }
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Error
    // Method Description    :   Writes the exception together with the buffered checkpoints.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   ex, step, response, methodName
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Error : </c> Writes the exception together with the buffered checkpoints.
    /// </summary>
    public void Error(Exception ex, string step, string response, string methodName)
    {
        logger.LogError(ex, "{MethodName} failed at {Step}. Response: {Response}. Trail: {Trail}", methodName, step, response, string.Join(" | ", _steps));
    }
}
