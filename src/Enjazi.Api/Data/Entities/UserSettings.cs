namespace Enjazi.Api.Data.Entities;

public sealed class UserSettings
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public SettingsData Data { get; set; } = new();
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>
/// The settings tree. Stored as one jsonb column; the shape is enforced here,
/// in C#, not by the database.
/// </summary>
public sealed class SettingsData
{
    public string Theme { get; set; } = "system";
    /// <summary>Nord until the user picks another. Accounts saved before Nord became the default keep their palette.</summary>
    public string Palette { get; set; } = "nord";
    public string TimeZone { get; set; } = "UTC";
    public NotificationSettings Notifications { get; set; } = new();
}

public sealed class NotificationSettings
{
    public bool EmailTaskReminders { get; set; } = true;
    public bool BrowserTaskReminders { get; set; } = true;
    public bool RoomMessages { get; set; } = true;
}
