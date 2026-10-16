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

        // The row and the admin role commit together, so a concurrent request
        // never reads the configured admin without the role.
        await using (var transaction = await db.Database.BeginTransactionAsync())
        {
            try
            {
                if ((await userManager.CreateAsync(user)).Succeeded)
                {
                    // AdminBootstrap covers a row that existed before the setting did.
                    if (string.Equals(email, configuration["Bootstrap:AdminEmail"], StringComparison.OrdinalIgnoreCase))
                    {
                        await AdminBootstrap.PromoteAsync(services, email);
                    }

                    await transaction.CommitAsync();
                    return user;
                }
            }
            catch (DbUpdateException)
            {
                db.ChangeTracker.Clear();
            }
        }

        // A new user's first page load sends several requests at once, and
        // each finds no row. One insert wins. The rest either fail Identity's
        // duplicate user name check or wait on a unique index until the winner
        // commits, depending on timing, and read the winner's row instead. No
        // row means the address belongs to a different Clerk user.
        return await db.Users.SingleOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
    }
}
