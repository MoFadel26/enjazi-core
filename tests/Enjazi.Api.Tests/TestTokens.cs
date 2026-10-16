using System.Security.Cryptography;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Enjazi.Api.Tests;

/// <summary>
/// Stands in for Clerk. ApiFactory points the bearer handler at this key and
/// issuer instead of Clerk's JWKS, so everything after signature validation,
/// the azp check and the creation of the local user included, is the code
/// production runs.
/// </summary>
public static class TestTokens
{
    public const string Issuer = "https://clerk.example.test";
    public const string Origin = "https://app.example.test";

    public static readonly SymmetricSecurityKey Key = new(RandomNumberGenerator.GetBytes(32));

    /// <summary>Guest:SigningKey for the test host, as configuration holds it.</summary>
    public static readonly string GuestKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    public static string NewClerkUserId() => $"user_{Guid.NewGuid():n}";

    public static string Create(
        string clerkUserId,
        string? email,
        string? name = "Test User",
        string? azp = Origin,
        SecurityKey? key = null)
    {
        var claims = new Dictionary<string, object> { ["sub"] = clerkUserId };
        if (email is not null) claims["email"] = email;
        if (name is not null) claims["name"] = name;
        if (azp is not null) claims["azp"] = azp;

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Claims = claims,
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(key ?? Key, SecurityAlgorithms.HmacSha256),
        });
    }
}
