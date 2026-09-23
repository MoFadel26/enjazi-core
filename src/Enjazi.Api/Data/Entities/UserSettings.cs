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
    public string TimeZone { get; set; } = "UTC";
    public NotificationSettings Notifications { get; set; } = new();
}

public sealed class NotificationSettings
{
    public bool EmailTaskReminders { get; set; } = true;
    public bool BrowserTaskReminders { get; set; } = true;
    public bool RoomMessages { get; set; } = true;
}
