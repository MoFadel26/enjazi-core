namespace Enjazi.Api.Data.Entities;

public sealed class Message
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;

    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
