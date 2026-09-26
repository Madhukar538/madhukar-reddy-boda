using System.Buffers.Binary;
using System.Formats.Cbor;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;

namespace Dhucar.Portfolio.Tests.Infrastructure;

/// <summary>
/// A minimal WebAuthn authenticator (ES256, "none" attestation, user verification) used to exercise the real
/// passkey registration and sign-in ceremonies end to end.
/// </summary>
public sealed class SoftwareAuthenticator
{
    private readonly ECDsa _key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
    private readonly string _rpId;
    private readonly string _origin;
    private uint _signCount;

    public SoftwareAuthenticator(string rpId, string origin)
    {
        _rpId = rpId;
        _origin = origin;
    }

    public byte[] CredentialId { get; } = RandomNumberGenerator.GetBytes(16);

    public byte[] UserHandle { get; private set; } = [];

    /// <summary>Answers navigator.credentials.create() options.</summary>
    public object Create(JsonElement options, string? originOverride = null)
    {
        UserHandle = WebEncoders.Base64UrlDecode(options.GetProperty("user").GetProperty("id").GetString()!);
        byte[] clientData = ClientData("webauthn.create", options.GetProperty("challenge").GetString()!, originOverride);
        ECParameters parameters = _key.ExportParameters(false);
        CborWriter cose = new(CborConformanceMode.Lax);
        cose.WriteStartMap(5);
        cose.WriteInt32(1); cose.WriteInt32(2);       // kty: EC2
        cose.WriteInt32(3); cose.WriteInt32(-7);      // alg: ES256
        cose.WriteInt32(-1); cose.WriteInt32(1);      // crv: P-256
        cose.WriteInt32(-2); cose.WriteByteString(parameters.Q.X!);
        cose.WriteInt32(-3); cose.WriteByteString(parameters.Q.Y!);
        cose.WriteEndMap();
        byte[] credentialLength = new byte[2];
        BinaryPrimitives.WriteUInt16BigEndian(credentialLength, (ushort)CredentialId.Length);
        byte[] authData = [.. AuthDataHeader(0x45), .. new byte[16], .. credentialLength, .. CredentialId, .. cose.Encode()];
        CborWriter attestation = new(CborConformanceMode.Lax);
        attestation.WriteStartMap(3);
        attestation.WriteTextString("fmt"); attestation.WriteTextString("none");
        attestation.WriteTextString("attStmt"); attestation.WriteStartMap(0); attestation.WriteEndMap();
        attestation.WriteTextString("authData"); attestation.WriteByteString(authData);
        attestation.WriteEndMap();
        return new
        {
            id = WebEncoders.Base64UrlEncode(CredentialId),
            rawId = WebEncoders.Base64UrlEncode(CredentialId),
            type = "public-key",
            response = new
            {
                clientDataJSON = WebEncoders.Base64UrlEncode(clientData),
                attestationObject = WebEncoders.Base64UrlEncode(attestation.Encode()),
                transports = new[] { "internal" },
            },
            clientExtensionResults = new { },
        };
    }

    /// <summary>Answers navigator.credentials.get() options, signing with the private key.</summary>
    public object Get(JsonElement options, bool isTampered = false)
    {
        byte[] clientData = ClientData("webauthn.get", options.GetProperty("challenge").GetString()!, null);
        byte[] authData = AuthDataHeader(0x05);
        byte[] signature = _key.SignData([.. authData, .. SHA256.HashData(clientData)], HashAlgorithmName.SHA256, DSASignatureFormat.Rfc3279DerSequence);
        if (isTampered)
        {
            signature[^1] ^= 0xFF;
        }
        return new
        {
            id = WebEncoders.Base64UrlEncode(CredentialId),
            rawId = WebEncoders.Base64UrlEncode(CredentialId),
            type = "public-key",
            response = new
            {
                clientDataJSON = WebEncoders.Base64UrlEncode(clientData),
                authenticatorData = WebEncoders.Base64UrlEncode(authData),
                signature = WebEncoders.Base64UrlEncode(signature),
                userHandle = WebEncoders.Base64UrlEncode(UserHandle),
            },
            clientExtensionResults = new { },
        };
    }

    private byte[] ClientData(string type, string challenge, string? originOverride)
    {
        return Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { type, challenge, origin = originOverride ?? _origin, crossOrigin = false }));
    }

    private byte[] AuthDataHeader(byte flags)
    {
        byte[] counter = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(counter, ++_signCount);
        return [.. SHA256.HashData(Encoding.UTF8.GetBytes(_rpId)), flags, .. counter];
    }
}
