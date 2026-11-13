using System.ComponentModel.DataAnnotations;

namespace Enjazi.Api.Contracts;

/// <summary>
/// Mirrors <see cref="Data.Entities.SettingsData"/>. A separate type so that
/// changing the stored shape is a deliberate change to the API too, rather
/// than something that leaks out of the jsonb column.
/// <see cref="ShowCompletedTasksOnCalendar"/> may be left out, which keeps
/// the saved value: a page loaded before the setting existed sends no such
/// field, and must not turn it off by saving the theme (ADR-0021).
/// </summary>
public sealed record SettingsRequest(
    [Required, MaxLength(20)] string Theme,
    [Required, MaxLength(20)] string Palette,
    [Required, MaxLength(100)] string TimeZone,
    [Required] NotificationSettingsContract Notifications,
    bool? ShowCompletedTasksOnCalendar = null);

public sealed record NotificationSettingsContract(
    bool EmailTaskReminders,
    bool BrowserTaskReminders,
    bool RoomMessages);

public sealed record SettingsResponse(
    string Theme,
    string Palette,
    string TimeZone,
    NotificationSettingsContract Notifications,
    bool ShowCompletedTasksOnCalendar,
    DateTimeOffset UpdatedAt);
