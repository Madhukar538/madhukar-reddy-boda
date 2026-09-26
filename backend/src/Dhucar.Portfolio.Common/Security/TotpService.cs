using System.Buffers.Binary;
using System.Security.Cryptography;

namespace Dhucar.Portfolio.Common.Security;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  RFC 6238 time-based one-time passwords (SHA-1, 30 seconds, 6 digits), compatible with standard authenticator apps.
 */
public class TotpService(TimeProvider timeProvider)
{
    private const int StepSeconds = 30;
    private const int Digits = 6;

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   GenerateSecret
    // Method Description    :   Creates a random 160-bit secret, Base32-encoded.
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
    /// <c>GenerateSecret : </c> Creates a random 160-bit secret, Base32-encoded.
    /// </summary>
    public string GenerateSecret()
    {
        return Base32.Encode(RandomNumberGenerator.GetBytes(20));
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   BuildUri
    // Method Description    :   Builds the otpauth:// URI shown as a QR code.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   issuer, account, secret
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>BuildUri : </c> Builds the otpauth:// URI shown as a QR code.
    /// </summary>
    public string BuildUri(string issuer, string account, string secret)
    {
        string label = Uri.EscapeDataString($"{issuer}:{account}");
        return $"otpauth://totp/{label}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&algorithm=SHA1&digits={Digits}&period={StepSeconds}";
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   CurrentStep
    // Method Description    :   Returns the current 30-second time step.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CurrentStep : </c> Returns the current 30-second time step.
    /// </summary>
    public long CurrentStep()
    {
        return timeProvider.GetUtcNow().ToUnixTimeSeconds() / StepSeconds;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   ComputeCode
    // Method Description    :   Computes the code for a secret at a time step.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   secret, step
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ComputeCode : </c> Computes the code for a secret at a time step.
    /// </summary>
    public string ComputeCode(string secret, long step)
    {
        byte[] key = Base32.Decode(secret);
        Span<byte> counter = stackalloc byte[8];
        BinaryPrimitives.WriteInt64BigEndian(counter, step);
        byte[] hash = HMACSHA1.HashData(key, counter);
        int offset = hash[^1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3];
        return (binary % 1_000_000).ToString("D6");
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   Verify
    // Method Description    :   Checks a code against the current step plus or minus one; steps at or before lastUsedStep are rejected so a code works only once.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   secret, code, lastUsedStep, matchedStep
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Verify : </c> Checks a code against the current step plus or minus one; steps at or before lastUsedStep are rejected so a code works only once.
    /// </summary>
    public bool Verify(string secret, string code, long lastUsedStep, out long matchedStep)
    {
        matchedStep = 0;
        string candidate = (code ?? string.Empty).Replace(" ", string.Empty);
        if (candidate.Length != Digits || !candidate.All(char.IsAsciiDigit))
        {
            return false;
        }
        long current = CurrentStep();
        bool isMatch = false;
        for (long step = current - 1; step <= current + 1; step++)
        {
            // Check every window step (no early exit) so timing doesn't reveal which one matched.
            bool isEqual = CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.ASCII.GetBytes(ComputeCode(secret, step)),
                System.Text.Encoding.ASCII.GetBytes(candidate));
            if (isEqual && step > lastUsedStep && !isMatch)
            {
                isMatch = true;
                matchedStep = step;
            }
        }
        return isMatch;
    }
}
