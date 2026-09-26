using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dhucar.Portfolio.Properties.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Dhucar.Portfolio.Common.Security;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Common
 * Modified By     :
 * Description     :  Issues and validates JWTs (HS256 only) and creates refresh tokens. Purpose tokens (MFA, enrolment) use their own audience so they can never be used as access tokens.
 */
public class TokenService
{
    private readonly SecuritySettings _settings;
    private readonly SymmetricSecurityKey _key;
    private readonly JsonWebTokenHandler _handler = new JsonWebTokenHandler();

    public TokenService(IOptions<PortfolioSettings> options)
    {
        _settings = options.Value.Security;
        byte[] keyBytes = Convert.FromBase64String(_settings.JwtSigningKey);
        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException("Portfolio:Security:JwtSigningKey must be at least 32 bytes, base64-encoded.");
        }
        _key = new SymmetricSecurityKey(keyBytes);
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   CreateAccessToken
    // Method Description    :   Issues a short-lived access token.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, email, securityStamp, authMethods, sessionId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (token, expiresAt)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CreateAccessToken : </c> Issues a short-lived access token.
    /// </summary>
    public (string Token, DateTime ExpiresAt) CreateAccessToken(string userId, string email, string securityStamp, IEnumerable<string> authMethods, string sessionId)
    {
        DateTime expiresAt = DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes);
        Dictionary<string, object> claims = new Dictionary<string, object>
        {
            ["sub"] = userId,
            ["email"] = email,
            ["stamp"] = securityStamp,
            ["sid"] = sessionId,
            ["amr"] = authMethods.ToArray(),
            ["jti"] = Guid.NewGuid().ToString("N"),
            ["purpose"] = "access",
        };
        return (Create(claims, _settings.JwtAudience, expiresAt), expiresAt);
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   CreatePurposeToken
    // Method Description    :   Issues a single-purpose token (mfa or enroll) bound to a stored challenge.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, purpose, challengeId, minutes
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (token, expiresAt)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CreatePurposeToken : </c> Issues a single-purpose token (mfa or enroll) bound to a stored challenge.
    /// </summary>
    public (string Token, DateTime ExpiresAt) CreatePurposeToken(string userId, string purpose, string challengeId, int minutes)
    {
        DateTime expiresAt = DateTime.UtcNow.AddMinutes(minutes);
        Dictionary<string, object> claims = new Dictionary<string, object>
        {
            ["sub"] = userId,
            ["cid"] = challengeId,
            ["purpose"] = purpose,
            ["jti"] = Guid.NewGuid().ToString("N"),
        };
        return (Create(claims, $"{_settings.JwtAudience}:{purpose}", expiresAt), expiresAt);
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   ValidateAccessToken
    // Method Description    :   Validates signature, issuer, audience, lifetime and purpose.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   token
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   ClaimsIdentity or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ValidateAccessToken : </c> Validates signature, issuer, audience, lifetime and purpose.
    /// </summary>
    public async Task<ClaimsIdentity?> ValidateAccessToken(string token)
    {
        ClaimsIdentity? identity = await Validate(token, _settings.JwtAudience);
        return identity?.FindFirst("purpose")?.Value == "access" ? identity : null;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   ValidatePurposeToken
    // Method Description    :   Validates a purpose token and returns its user and challenge ids.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   token, purpose
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (userId, challengeId) or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ValidatePurposeToken : </c> Validates a purpose token and returns its user and challenge ids.
    /// </summary>
    public async Task<(string UserId, string ChallengeId)?> ValidatePurposeToken(string token, string purpose)
    {
        ClaimsIdentity? identity = await Validate(token, $"{_settings.JwtAudience}:{purpose}");
        if (identity?.FindFirst("purpose")?.Value != purpose)
        {
            return null;
        }
        string userId = identity.FindFirst("sub")?.Value ?? string.Empty;
        string challengeId = identity.FindFirst("cid")?.Value ?? string.Empty;
        return userId.Length > 0 && challengeId.Length > 0 ? (userId, challengeId) : null;
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   NewOpaqueToken
    // Method Description    :   Creates a random 256-bit URL-safe token (refresh tokens, challenge ids).
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
    /// <c>NewOpaqueToken : </c> Creates a random 256-bit URL-safe token (refresh tokens, challenge ids).
    /// </summary>
    public string NewOpaqueToken()
    {
        return Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(32));
    }

    //****************************************************************************************************
    // Layer                 :   Common
    // Method Name           :   HashOpaqueToken
    // Method Description    :   SHA-256 hash used to store opaque tokens.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   token
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   string
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>HashOpaqueToken : </c> SHA-256 hash used to store opaque tokens.
    /// </summary>
    public string HashOpaqueToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }

    private string Create(Dictionary<string, object> claims, string audience, DateTime expiresAt)
    {
        SecurityTokenDescriptor descriptor = new SecurityTokenDescriptor
        {
            Issuer = _settings.JwtIssuer,
            Audience = audience,
            Claims = claims,
            IssuedAt = DateTime.UtcNow,
            NotBefore = DateTime.UtcNow,
            Expires = expiresAt,
            SigningCredentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256),
        };
        return _handler.CreateToken(descriptor);
    }

    private async Task<ClaimsIdentity?> Validate(string token, string audience)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 4096)
        {
            return null;
        }
        TokenValidationResult result = await _handler.ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidIssuer = _settings.JwtIssuer,
            ValidAudience = audience,
            IssuerSigningKey = _key,
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            RequireExpirationTime = true,
            RequireSignedTokens = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        });
        return result.IsValid ? result.ClaimsIdentity : null;
    }
}
