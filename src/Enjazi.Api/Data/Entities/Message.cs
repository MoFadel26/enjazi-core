namespace Enjazi.Api.Data.Entities;

public sealed class Message
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;
    /// <summary>
    /// Null once the author deletes their account: the message stays in the
    /// room and reads as from a deleted user (ADR-0019).
    /// </summary>
    public Guid? AuthorId { get; set; }
    public User? Author { get; set; }

    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
