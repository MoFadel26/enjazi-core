using System.ComponentModel.DataAnnotations;

namespace Enjazi.Api.Contracts;

/// <summary>
/// Mirrors <see cref="Data.Entities.SettingsData"/>. A separate type so that
/// changing the stored shape is a deliberate change to the API too, rather
/// than something that leaks out of the jsonb column.
/// </summary>
public sealed record SettingsRequest(
    [Required, MaxLength(20)] string Theme,
    [Required, MaxLength(100)] string TimeZone,
    [Required] NotificationSettingsContract Notifications);

public sealed record NotificationSettingsContract(
    bool EmailTaskReminders,
    bool BrowserTaskReminders,
    bool RoomMessages);

public sealed record SettingsResponse(
    string Theme,
    string TimeZone,
    NotificationSettingsContract Notifications,
    DateTimeOffset UpdatedAt);
