using System.Security.Claims;
using Enjazi.Api.Data.Entities;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Enjazi.Api.Auth;

/// <summary>
/// Issues and reads the API's own tokens for guests (ADR-0017). HS256 with
/// Guest:SigningKey, a base64 key of at least 32 bytes kept in configuration,
/// never in the repository. Without the key guest mode is off: nothing is
/// issued and no guest token validates, and the rest of the API runs as before.
/// </summary>
public sealed class GuestTokens
{
    public const string Issuer = "enjazi-guest";
    public const string Audience = "enjazi-api";

    /// <summary>
    /// How long one token lives. The web app refreshes it before then, until
    /// the guest itself expires.
    /// </summary>
    public static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(15);

    private readonly JsonWebTokenHandler _handler = new();

    public GuestTokens(IConfiguration configuration)
    {
        var key = configuration["Guest:SigningKey"];
        if (!string.IsNullOrWhiteSpace(key))
        {
            var bytes = Convert.FromBase64String(key);
            if (bytes.Length < 32)
            {
                throw new InvalidOperationException("Guest:SigningKey must be at least 32 bytes, base64-encoded.");
            }

            Key = new SymmetricSecurityKey(bytes);
        }

        Lifetime = TimeSpan.FromDays(configuration.GetValue("Guest:LifetimeDays", 7));
    }

    /// <summary>Null when guest mode is not configured.</summary>
    public SymmetricSecurityKey? Key { get; }

    /// <summary>How long a guest account lives, from Guest:LifetimeDays.</summary>
    public TimeSpan Lifetime { get; }

    public bool Enabled => Key is not null;

    /// <summary>
    /// What the Guest bearer scheme checks. Lifetime is skipped only by
    /// <see cref="ReadGuestIdAsync"/>, for refresh and sign-up.
    /// </summary>
    public TokenValidationParameters Parameters(bool validateLifetime = true) => new()
    {
        ValidIssuer = Issuer,
        ValidAudience = Audience,
        IssuerSigningKey = Key,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = validateLifetime,
        // Without a key nothing can validate; this makes the failure explicit.
        RequireSignedTokens = true,
        ClockSkew = TimeSpan.FromSeconds(30),
    };

    /// <summary>A token for the guest, never outliving the guest itself.</summary>
    public string Create(User guest, DateTimeOffset now)
    {
        var expires = now + TokenLifetime;
        if (guest.ExpiresAt is { } end && end < expires)
        {
            expires = end;
        }

        return _handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Audience = Audience,
            Claims = new Dictionary<string, object> { ["sub"] = guest.Id.ToString() },
            IssuedAt = now.UtcDateTime,
            NotBefore = now.UtcDateTime,
            Expires = expires.UtcDateTime,
            SigningCredentials = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256),
        });
    }

    /// <summary>
    /// The guest id in a token this API signed, whether or not the token has
    /// expired. Signature, issuer and audience are checked; whether the guest
    /// still exists is the caller's question.
    /// </summary>
    public async Task<Guid?> ReadGuestIdAsync(string? token)
    {
        if (!Enabled || string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var result = await _handler.ValidateTokenAsync(token, Parameters(validateLifetime: false));
        return result.IsValid && Guid.TryParse(result.ClaimsIdentity.FindFirst("sub")?.Value, out var id) ? id : null;
    }

    /// <summary>
    /// True when the token claims to be ours. Read without validation, only to
    /// pick the scheme that then validates it.
    /// </summary>
    public static bool IsGuestToken(string? token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return false;
        }

        var handler = new JsonWebTokenHandler();
        try
        {
            return handler.CanReadToken(token) && handler.ReadJsonWebToken(token).Issuer == Issuer;
        }
        catch (Exception e) when (e is ArgumentException or SecurityTokenException)
        {
            return false;
        }
    }

    public static Guid? GuestId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
}
