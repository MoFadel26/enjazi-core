using System.Security.Claims;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;

namespace Enjazi.Api.Auth;

/// <summary>
/// Validates Clerk session tokens and turns them into a principal carrying the
/// local user's id and roles, so <see cref="CurrentUser"/>, the query filters
/// and the Admin policy work exactly as they did with the cookie (ADR-0015).
/// Reads Clerk:Authority, the instance's Frontend API URL, whose JWKS signs the
/// tokens, and Clerk:AuthorizedParties, the origins the web app is served from.
/// </summary>
public static class ClerkAuthentication
{
    public static void Configure(JwtBearerOptions options, IConfiguration configuration)
    {
        options.Authority = configuration["Clerk:Authority"];

        // Leaves sub as sub. With mapping on, sub would arrive as
        // NameIdentifier, the claim CurrentUser reads as the local Guid.
        options.MapInboundClaims = false;

        // Clerk session tokens have no aud. The azp check below is what ties
        // a token to this application.
        options.TokenValidationParameters.ValidateAudience = false;

        var authorizedParties = configuration.GetSection("Clerk:AuthorizedParties").Get<string[]>() ?? [];
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ReadHubToken,
            OnTokenValidated = context => OnTokenValidatedAsync(context, authorizedParties),
        };
    }

    /// <summary>
    /// A browser cannot set headers on a WebSocket upgrade, so SignalR sends
    /// the token as ?access_token=. Accepted on the hub only: anywhere else a
    /// token in the URL would end up in logs and history for no reason.
    /// </summary>
    private static Task ReadHubToken(MessageReceivedContext context)
    {
        string? token = context.Request.Query["access_token"];
        if (!string.IsNullOrEmpty(token) && context.Request.Path.StartsWithSegments("/hubs/rooms"))
        {
            context.Token = token;
        }

        return Task.CompletedTask;
    }

    private static async Task OnTokenValidatedAsync(TokenValidatedContext context, string[] authorizedParties)
    {
        var principal = context.Principal!;

        // Clerk's rule: azp, when present, must be one of this app's origins.
        // It stops a token issued to another site on the same Clerk instance
        // from being accepted here.
        var azp = principal.FindFirstValue("azp");
        if (azp is not null && !authorizedParties.Contains(azp, StringComparer.Ordinal))
        {
            context.Fail($"azp '{azp}' is not an authorized party.");
            return;
        }

        var services = context.HttpContext.RequestServices;
        var user = await services.GetRequiredService<ClerkUserProvisioner>().FindOrCreateAsync(principal);
        if (user is null)
        {
            context.Fail("The session token has no usable email claim, or its address belongs to another account.");
            return;
        }

        // Disabling is Identity's lockout. Checked on every request, so a
        // disabled user's next API call fails, whatever their Clerk session.
        var users = services.GetRequiredService<UserManager<User>>();
        if (await users.IsLockedOutAsync(user))
        {
            context.Fail("The account is disabled.");
            return;
        }

        var identity = (ClaimsIdentity)principal.Identity!;
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
        foreach (var role in await users.GetRolesAsync(user))
        {
            identity.AddClaim(new Claim(identity.RoleClaimType, role));
        }
    }
}
