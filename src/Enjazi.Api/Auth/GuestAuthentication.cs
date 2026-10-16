using System.Security.Claims;
using Enjazi.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Auth;

/// <summary>
/// The second issuer (ADR-0017). Clerk signs real users' tokens, this API
/// signs guests'. Both schemes end in the same principal: NameIdentifier is
/// the local Guid, so <see cref="CurrentUser"/>, the query filters and the
/// policies do not know which one ran. A guest also carries the Guest role,
/// which is not a stored role, and never a stored one.
/// </summary>
public static class GuestAuthentication
{
    public const string Scheme = "Guest";

    /// <summary>The default scheme: forwards each request to Clerk's or ours.</summary>
    public const string ClerkOrGuest = "ClerkOrGuest";

    /// <summary>
    /// Sent with a Clerk token while the browser still holds a guest token, so
    /// a guest who signs up keeps their data.
    /// </summary>
    public const string UpgradeHeader = "X-Guest-Token";

    public static void Configure(JwtBearerOptions options, GuestTokens tokens)
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = tokens.Parameters();
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ClerkAuthentication.ReadHubToken,
            OnTokenValidated = OnTokenValidatedAsync,
        };
    }

    /// <summary>
    /// Picks the scheme by the token's issuer, read without validation. The
    /// chosen scheme then validates everything, so a forged issuer only picks
    /// which key the forgery fails against.
    /// </summary>
    public static string SelectScheme(HttpContext context)
    {
        var token = ClerkAuthentication.HubToken(context.Request);
        if (token is null)
        {
            string? header = context.Request.Headers.Authorization;
            if (header?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
            {
                token = header["Bearer ".Length..].Trim();
            }
        }

        return GuestTokens.IsGuestToken(token) ? Scheme : JwtBearerDefaults.AuthenticationScheme;
    }

    /// <summary>
    /// A valid signature is not enough: the row has to still be a live guest.
    /// This is what makes an expired guest's requests 401 whether or not the
    /// cleanup has run, and what stops a guest token naming a real user.
    /// </summary>
    private static async Task OnTokenValidatedAsync(TokenValidatedContext context)
    {
        var principal = context.Principal!;
        var id = GuestTokens.GuestId(principal);
        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var now = DateTimeOffset.UtcNow;
        var alive = id is not null && await db.Users.AnyAsync(u => u.Id == id && u.IsGuest && u.ExpiresAt > now);
        if (!alive)
        {
            context.Fail("The guest session has expired.");
            return;
        }

        var identity = (ClaimsIdentity)principal.Identity!;
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, id!.Value.ToString()));
        identity.AddClaim(new Claim(identity.RoleClaimType, Roles.Guest));
    }
}
