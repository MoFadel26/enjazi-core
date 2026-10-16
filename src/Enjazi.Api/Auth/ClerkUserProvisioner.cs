using System.Security.Claims;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Auth;

/// <summary>
/// Maps a Clerk user to the local users row, creating the row the first time
/// that Clerk user calls the API. The email and name come from the session
/// token, which carries them only once the token is customised in the Clerk
/// Dashboard (ADR-0015). Later changes in Clerk do not reach the row.
/// </summary>
public sealed class ClerkUserProvisioner(
    AppDbContext db,
    UserManager<User> userManager,
    IServiceProvider services,
    IConfiguration configuration)
{
    private const int DisplayNameLength = 100;

    /// <summary>
    /// Null when the token has no email, or the address already belongs to a
    /// row with a different Clerk id.
    /// </summary>
    public async Task<User?> FindOrCreateAsync(ClaimsPrincipal principal)
    {
        var clerkUserId = principal.FindFirstValue("sub");
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return null;
        }

        var user = await db.Users.SingleOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
        if (user is not null)
        {
            return user;
        }

        var email = principal.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var name = principal.FindFirstValue("name")?.Trim();
        user = new User
        {
            ClerkUserId = clerkUserId,
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = string.IsNullOrEmpty(name) ? email.Split('@')[0] : name[..Math.Min(name.Length, DisplayNameLength)],
            CreatedAt = DateTimeOffset.UtcNow,
        };

        try
        {
            if (!(await userManager.CreateAsync(user)).Succeeded)
            {
                return null;
            }
        }
        catch (DbUpdateException)
        {
            // A new user's first page load sends several requests at once, and
            // each finds no row. One insert wins; the rest hit the unique
            // index on clerk_user_id and read the winner's row instead.
            db.ChangeTracker.Clear();
            return await db.Users.SingleOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
        }

        // The configured first admin, promoted the moment the row exists.
        // AdminBootstrap covers a row that existed before the setting did.
        if (string.Equals(email, configuration["Bootstrap:AdminEmail"], StringComparison.OrdinalIgnoreCase))
        {
            await AdminBootstrap.PromoteAsync(services, email);
        }

        return user;
    }
}
