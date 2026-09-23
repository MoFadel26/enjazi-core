namespace Enjazi.Api.Data.Entities;

public sealed class Room
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<RoomMember> Members { get; } = [];
    public ICollection<Message> Messages { get; } = [];
}
