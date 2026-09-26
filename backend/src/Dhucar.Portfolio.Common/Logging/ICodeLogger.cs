namespace Dhucar.Portfolio.Common.Logging;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Step and error logger injected into controllers and BAL classes.
 */
public interface ICodeLogger
{
    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Code
    // Method Description    :   Records a checkpoint in the current request's trail.
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
    /// <c>Code : </c> Records a checkpoint in the current request's trail.
    /// </summary>
    void Code(string step, string message);

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Error
    // Method Description    :   Logs an exception with the request's checkpoint trail.
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
    /// <c>Error : </c> Logs an exception with the request's checkpoint trail.
    /// </summary>
    void Error(Exception ex, string step, string response, string methodName);
}
