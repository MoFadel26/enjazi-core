using Enjazi.Api.Auth;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUser currentUser)
    : IdentityDbContext<User, Role, Guid>(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<CalendarEvent> Events => Set<CalendarEvent>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomMember> RoomMembers => Set<RoomMember>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<UserSettings> Settings => Set<UserSettings>();
    public DbSet<Streak> Streaks => Set<Streak>();

    /// <summary>
    /// Read by the query filter below. A property on the context rather than a
    /// captured constant: the model is built once and cached, so the filter
    /// has to become a query parameter that is re-evaluated per query.
    /// </summary>
    private Guid CurrentUserId => currentUser.Id;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Ownership is enforced here, not in the controllers. Every read of
        // these tables gets "where owner_id = @current" appended, so another
        // user's row is not found rather than found-and-refused.
        builder.Entity<TaskItem>().HasQueryFilter(t => t.OwnerId == CurrentUserId);
        builder.Entity<CalendarEvent>().HasQueryFilter(e => e.OwnerId == CurrentUserId);
        builder.Entity<UserSettings>().HasQueryFilter(s => s.UserId == CurrentUserId);

        // Rooms are deliberately not filtered: they are shared, and every
        // signed-in user can see that a room exists in order to join it.
        // Membership gates their contents instead. See ADR-0007.
    }
}
