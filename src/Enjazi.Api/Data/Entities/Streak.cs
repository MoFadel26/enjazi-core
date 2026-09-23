namespace Enjazi.Api.Data.Entities;

public sealed class Streak
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int CurrentLength { get; set; }
    public int LongestLength { get; set; }
    public int Points { get; set; }
    public DateOnly? LastCompletedOn { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
