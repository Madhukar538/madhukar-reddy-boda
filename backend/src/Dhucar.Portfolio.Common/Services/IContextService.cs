namespace Dhucar.Portfolio.Common.Services;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Request context: client address, user agent and the signed-in admin.
 */
public interface IContextService
{
    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetClientIp
    // Method Description    :   Returns the client IP address (Cloudflare header only when trusted).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetClientIp : </c> Returns the client IP address (Cloudflare header only when trusted).
    /// </summary>
    string GetClientIp();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetUserAgent
    // Method Description    :   Returns the user agent, truncated to 256 characters.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetUserAgent : </c> Returns the user agent, truncated to 256 characters.
    /// </summary>
    string GetUserAgent();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetCountry
    // Method Description    :   Returns the CDN-reported two-letter country, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetCountry : </c> Returns the CDN-reported two-letter country, or empty.
    /// </summary>
    string GetCountry();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetHeader
    // Method Description    :   Returns a request header value, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   name
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetHeader : </c> Returns a request header value, or empty.
    /// </summary>
    string GetHeader(string name);

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetUserId
    // Method Description    :   Returns the authenticated admin's user id, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetUserId : </c> Returns the authenticated admin's user id, or empty.
    /// </summary>
    string GetUserId();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetEmail
    // Method Description    :   Returns the authenticated admin's email, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetEmail : </c> Returns the authenticated admin's email, or empty.
    /// </summary>
    string GetEmail();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetClaim
    // Method Description    :   Returns a claim of the authenticated admin, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   type
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetClaim : </c> Returns a claim of the authenticated admin, or empty.
    /// </summary>
    string GetClaim(string type);

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GetRefreshCookie
    // Method Description    :   Returns the refresh token from its HttpOnly cookie, or empty.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetRefreshCookie : </c> Returns the refresh token from its HttpOnly cookie, or empty.
    /// </summary>
    string GetRefreshCookie();

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   SetRefreshCookie
    // Method Description    :   Writes the refresh token as an HttpOnly, SameSite=Strict cookie.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   token, expiresAt
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SetRefreshCookie : </c> Writes the refresh token as an HttpOnly, SameSite=Strict cookie.
    /// </summary>
    void SetRefreshCookie(string token, DateTime expiresAt);

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   ClearRefreshCookie
    // Method Description    :   Deletes the refresh cookie.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ClearRefreshCookie : </c> Deletes the refresh cookie.
    /// </summary>
    void ClearRefreshCookie();
}
