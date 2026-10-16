using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Auth;

public enum AccountDeletionResult
{
    Deleted,

    /// <summary>A Clerk account, and no Clerk:SecretKey to delete it with.</summary>
    Unavailable,

    /// <summary>The caller is the only admin; the admin panel would have nobody.</summary>
    LastAdmin,
}

/// <summary>
/// Deletes the caller's account (ADR-0019). Rooms they created pass to the
/// member who joined earliest, who becomes a room admin; a room with no one
/// else in it is deleted. Their messages in rooms stay, without an author,
/// except a guest's, which go as they do on expiry (ADR-0017). Everything
/// else they own goes with the users row, by the cascades.
///
/// The Clerk user is deleted last, inside the transaction: if Clerk refuses,
/// the transaction rolls back and nothing is deleted. The only admin cannot
/// delete their account until someone else is an admin.
/// </summary>
public sealed class AccountDeletion(AppDbContext db, UserManager<User> userManager, IClerkUsers clerk)
{
    public async Task<AccountDeletionResult> DeleteAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.SingleAsync(u => u.Id == userId, cancellationToken);
        if (user.ClerkUserId is not null && !clerk.Enabled)
        {
            return AccountDeletionResult.Unavailable;
        }

        if (await userManager.IsInRoleAsync(user, Roles.Admin) &&
            (await userManager.GetUsersInRoleAsync(Roles.Admin)).Count <= 1)
        {
            return AccountDeletionResult.LastAdmin;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var rooms = await db.Rooms
            .Include(r => r.Members)
            .Where(r => r.OwnerId == userId)
            .ToListAsync(cancellationToken);
        foreach (var room in rooms)
        {
            var heir = room.Members
                .Where(m => m.UserId != userId)
                .OrderBy(m => m.JoinedAt)
                .ThenBy(m => m.UserId)
                .FirstOrDefault();
            if (heir is null)
            {
                db.Rooms.Remove(room);
                continue;
            }

            room.OwnerId = heir.UserId;
            heir.Role = RoomRole.Admin;
        }

        await db.SaveChangesAsync(cancellationToken);

        if (user.IsGuest)
        {
            await db.Messages.Where(m => m.AuthorId == userId).ExecuteDeleteAsync(cancellationToken);
        }

        await db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync(cancellationToken);

        if (user.ClerkUserId is not null)
        {
            await clerk.DeleteAsync(user.ClerkUserId, cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return AccountDeletionResult.Deleted;
    }
}
