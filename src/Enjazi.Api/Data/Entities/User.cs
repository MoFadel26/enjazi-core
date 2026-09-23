using Microsoft.AspNetCore.Identity;

namespace Enjazi.Api.Data.Entities;

public sealed class User : IdentityUser<Guid>
{
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
