namespace Enjazi.Api.Data.Entities;

public enum RoomRole
{
    Member = 0,
    Admin = 1,
}

public sealed class RoomMember
{
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public RoomRole Role { get; set; } = RoomRole.Member;
    public DateTimeOffset JoinedAt { get; set; }
}
