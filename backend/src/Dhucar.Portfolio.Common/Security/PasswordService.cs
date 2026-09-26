using Microsoft.AspNetCore.Identity;

namespace Dhucar.Portfolio.Common.Security;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Password hashing with ASP.NET Core Identity's PBKDF2 (HMAC-SHA512, 100,000 iterations, random salt).
 */
public class PasswordService
{
    private static readonly object HashOwner = new object();
    private readonly PasswordHasher<object> _hasher = new PasswordHasher<object>();
    private readonly string _dummyHash;

    public PasswordService()
    {
        _dummyHash = _hasher.HashPassword(HashOwner, Guid.NewGuid().ToString("N"));
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Hash
    // Method Description    :   Hashes a password.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   password
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Hash : </c> Hashes a password.
    /// </summary>
    public string Hash(string password)
    {
        return _hasher.HashPassword(HashOwner, password);
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Verify
    // Method Description    :   Verifies a password against a stored hash.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   hash, password
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Verify : </c> Verifies a password against a stored hash.
    /// </summary>
    public bool Verify(string hash, string password)
    {
        return _hasher.VerifyHashedPassword(HashOwner, hash, password) != PasswordVerificationResult.Failed;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   VerifyDummy
    // Method Description    :   Spends the same time as a real check, so unknown emails can't be told apart by timing.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   password
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   void
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>VerifyDummy : </c> Spends the same time as a real check, so unknown emails can't be told apart by timing.
    /// </summary>
    public void VerifyDummy(string password)
    {
        _hasher.VerifyHashedPassword(HashOwner, _dummyHash, password);
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   IsAcceptable
    // Method Description    :   Password policy: 12 to 128 characters and not a single repeated character.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   password
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>IsAcceptable : </c> Password policy: 12 to 128 characters and not a single repeated character.
    /// </summary>
    public bool IsAcceptable(string password)
    {
        return password.Length is >= 12 and <= 128 && password.Distinct().Count() > 4;
    }
}
