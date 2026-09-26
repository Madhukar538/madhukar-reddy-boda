using System.Text;

namespace Dhucar.Portfolio.Common.Security;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  RFC 4648 Base32 (no padding), the encoding authenticator apps use for TOTP secrets.
 */
public static class Base32
{
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Encode
    // Method Description    :   Encodes bytes as unpadded Base32.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   data
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Encode : </c> Encodes bytes as unpadded Base32.
    /// </summary>
    public static string Encode(byte[] data)
    {
        StringBuilder output = new StringBuilder((data.Length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        foreach (byte value in data)
        {
            buffer = (buffer << 8) | value;
            bitsLeft += 8;
            while (bitsLeft >= 5)
            {
                output.Append(Alphabet[(buffer >> (bitsLeft - 5)) & 31]);
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0)
        {
            output.Append(Alphabet[(buffer << (5 - bitsLeft)) & 31]);
        }
        return output.ToString();
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Decode
    // Method Description    :   Decodes Base32, ignoring case, spaces and padding.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   text
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   byte[]
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Decode : </c> Decodes Base32, ignoring case, spaces and padding.
    /// </summary>
    public static byte[] Decode(string text)
    {
        string clean = text.Replace(" ", string.Empty).Replace("-", string.Empty).TrimEnd('=').ToUpperInvariant();
        List<byte> output = new List<byte>(clean.Length * 5 / 8);
        int buffer = 0;
        int bitsLeft = 0;
        foreach (char character in clean)
        {
            int index = Alphabet.IndexOf(character);
            if (index < 0)
            {
                throw new FormatException("Invalid Base32 character.");
            }
            buffer = (buffer << 5) | index;
            bitsLeft += 5;
            if (bitsLeft >= 8)
            {
                output.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }
        return output.ToArray();
    }
}
