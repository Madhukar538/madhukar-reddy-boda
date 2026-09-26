using System.Security.Cryptography;
using System.Text;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;

namespace Dhucar.Portfolio.Common.Security;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Encrypts small secrets (TOTP keys) at rest with AES-256-GCM.
 */
public class SecretProtector
{
    private readonly byte[] _key;

    public SecretProtector(IOptions<PortfolioSettings> options)
    {
        _key = Convert.FromBase64String(options.Value.Security.EncryptionKey);
        if (_key.Length != 32)
        {
            throw new InvalidOperationException("Portfolio:Security:EncryptionKey must be 32 bytes, base64-encoded.");
        }
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Protect
    // Method Description    :   Encrypts text; output is base64 of nonce, tag and ciphertext.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   plainText
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Protect : </c> Encrypts text; output is base64 of nonce, tag and ciphertext.
    /// </summary>
    public string Protect(string plainText)
    {
        byte[] plain = Encoding.UTF8.GetBytes(plainText);
        byte[] nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize);
        byte[] tag = new byte[AesGcm.TagByteSizes.MaxSize];
        byte[] cipher = new byte[plain.Length];
        using AesGcm aes = new AesGcm(_key, tag.Length);
        aes.Encrypt(nonce, plain, cipher, tag);
        return Convert.ToBase64String([.. nonce, .. tag, .. cipher]);
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Unprotect
    // Method Description    :   Decrypts text produced by Protect; throws if it was tampered with.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   protectedText
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Unprotect : </c> Decrypts text produced by Protect; throws if it was tampered with.
    /// </summary>
    public string Unprotect(string protectedText)
    {
        byte[] data = Convert.FromBase64String(protectedText);
        int nonceSize = AesGcm.NonceByteSizes.MaxSize;
        int tagSize = AesGcm.TagByteSizes.MaxSize;
        byte[] plain = new byte[data.Length - nonceSize - tagSize];
        using AesGcm aes = new AesGcm(_key, tagSize);
        aes.Decrypt(data.AsSpan(0, nonceSize), data.AsSpan(nonceSize + tagSize), data.AsSpan(nonceSize, tagSize), plain);
        return Encoding.UTF8.GetString(plain);
    }
}
