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
 * Description     :  Single-use recovery codes. Codes carry 100 random bits, so a fast SHA-256 hash is enough to store them.
 */
public class RecoveryCodeService
{
    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Generate
    // Method Description    :   Creates new codes and their hashes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   count
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (codes, hashes)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Generate : </c> Creates new codes and their hashes.
    /// </summary>
    public (List<string> Codes, List<string> Hashes) Generate(int count = 10)
    {
        List<string> codes = new List<string>(count);
        for (int index = 0; index < count; index++)
        {
            string raw = Base32.Encode(RandomNumberGenerator.GetBytes(13))[..20];
            codes.Add($"{raw[..5]}-{raw[5..10]}-{raw[10..15]}-{raw[15..20]}");
        }
        return (codes, codes.Select(Hash).ToList());
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Hash
    // Method Description    :   Hashes a code after normalising case, spaces and dashes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   code
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Hash : </c> Hashes a code after normalising case, spaces and dashes.
    /// </summary>
    public string Hash(string code)
    {
        string normalized = new string((code ?? string.Empty).ToUpperInvariant().Where(char.IsAsciiLetterOrDigit).ToArray());
        return Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(normalized)));
    }
}
