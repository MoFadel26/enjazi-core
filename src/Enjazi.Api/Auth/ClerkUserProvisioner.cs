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
    GuestTokens guestTokens,
    IServiceProvider services,
    IConfiguration configuration)
{
    private const int DisplayNameLength = 100;

    /// <summary>
    /// Null when the token has no email, or the address already belongs to a
    /// row with a different Clerk id. A new Clerk user who sends a live guest's
    /// token takes over that guest's row instead of getting an empty one.
    /// </summary>
    public async Task<User?> FindOrCreateAsync(ClaimsPrincipal principal, string? guestToken = null)
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
        var displayName = string.IsNullOrEmpty(name) ? email.Split('@')[0] : name[..Math.Min(name.Length, DisplayNameLength)];

        if (await UpgradeGuestAsync(guestToken, clerkUserId, email, displayName) is { } upgraded)
        {
            return upgraded;
        }

        user = new User
        {
            ClerkUserId = clerkUserId,
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            CreatedAt = Timestamps.UtcNow(),
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

    /// <summary>
    /// Turns the guest's row into the new account. The id stays, so every
    /// task, event, streak, setting and membership it owns is the new user's
    /// with nothing reassigned (ADR-0017). Null, and nothing changed, when the
    /// token is not one of ours, the guest has expired, or the update loses to
    /// a concurrent first request or a taken address; the caller then carries
    /// on as for any new user.
    /// </summary>
    private async Task<User?> UpgradeGuestAsync(string? guestToken, string clerkUserId, string email, string displayName)
    {
        var guestId = await guestTokens.ReadGuestIdAsync(guestToken);
        if (guestId is null)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var guest = await db.Users.SingleOrDefaultAsync(u => u.Id == guestId && u.IsGuest && u.ExpiresAt > now);
        if (guest is null)
        {
            return null;
        }

        guest.ClerkUserId = clerkUserId;
        guest.UserName = email;
        guest.Email = email;
        guest.EmailConfirmed = true;
        guest.DisplayName = displayName;
        guest.IsGuest = false;
        guest.ExpiresAt = null;

        // Identity's concurrency stamp lets exactly one of several concurrent
        // first requests win; the others fail here and read the winner's row.
        try
        {
            if ((await userManager.UpdateAsync(guest)).Succeeded)
            {
                if (string.Equals(email, configuration["Bootstrap:AdminEmail"], StringComparison.OrdinalIgnoreCase))
                {
                    await AdminBootstrap.PromoteAsync(services, email);
                }

                return guest;
            }
        }
        catch (DbUpdateException)
        {
        }

        db.ChangeTracker.Clear();
        return null;
    }
}
