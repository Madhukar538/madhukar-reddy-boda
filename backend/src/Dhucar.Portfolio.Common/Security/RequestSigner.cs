using System.Security.Cryptography;
using System.Text;

namespace Dhucar.Portfolio.Common.Security;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  HMAC-SHA256 signatures for server-to-server webhooks (timestamp + body), so the receiver can reject forged or replayed calls.
 */
public static class RequestSigner
{
    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Sign
    // Method Description    :   Signs "{timestamp}.{body}" and returns "sha256=<hex>".
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   secret, timestamp, body
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Sign : </c> Signs "{timestamp}.{body}" and returns "sha256=<hex>".
    /// </summary>
    public static string Sign(string secret, string timestamp, string body)
    {
        byte[] hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes($"{timestamp}.{body}"));
        return "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();
    }
}
