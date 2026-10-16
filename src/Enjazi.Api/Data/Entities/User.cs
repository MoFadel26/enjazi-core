using Microsoft.AspNetCore.Identity;

namespace Enjazi.Api.Data.Entities;

public sealed class User : IdentityUser<Guid>
{
    /// <summary>
    /// The Clerk user id, the session token's sub claim. Set once, when the
    /// first request from that Clerk user creates this row (ADR-0015).
    /// </summary>
    public string ClerkUserId { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<TaskItem> Tasks { get; } = [];
    public ICollection<CalendarEvent> Events { get; } = [];
    public ICollection<Room> OwnedRooms { get; } = [];
    public ICollection<RoomMember> Memberships { get; } = [];
    public ICollection<Message> Messages { get; } = [];
    public UserSettings? Settings { get; set; }
    public Streak? Streak { get; set; }
}

public sealed class Role : IdentityRole<Guid>;
