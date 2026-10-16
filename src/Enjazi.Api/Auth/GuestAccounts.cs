using Enjazi.Api.Controllers;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Enjazi.Api.Streaks;
using Microsoft.AspNetCore.Identity;

namespace Enjazi.Api.Auth;

/// <summary>
/// Creates guest accounts (ADR-0017): a real users row with is_guest set and
/// an expiry, plus a small sample so the app does not open empty. The row and
/// the sample commit together.
/// </summary>
public sealed class GuestAccounts(
    AppDbContext db,
    UserManager<User> userManager,
    GuestTokens tokens,
    [FromKeyedServices(StreakClock.Key)] TimeProvider streakClock)
{
    public async Task<User> CreateAsync(string? timeZone, string? theme = null)
    {
        var zone = timeZone is not null && TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out var found)
            ? found
            : TimeZoneInfo.Utc;
        var now = Timestamps.UtcNow();
        var id = Guid.NewGuid();

        // Identity wants a unique user name and email. .invalid is reserved
        // (RFC 2606), so the address can never belong to anyone.
        var guest = new User
        {
            Id = id,
            UserName = $"guest-{id:n}",
            Email = $"guest-{id:n}@guest.invalid",
            DisplayName = $"Guest {id.ToString("n")[..4].ToUpperInvariant()}",
            IsGuest = true,
            ExpiresAt = now + tokens.Lifetime,
            CreatedAt = now,
        };

        await using var transaction = await db.Database.BeginTransactionAsync();
        var result = await userManager.CreateAsync(guest);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Creating a guest failed: {string.Join("; ", result.Errors.Select(e => e.Description))}");
        }

        Seed(guest.Id, zone, theme is not null && SettingsController.Themes.Contains(theme) ? theme : "system", now);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return guest;
    }

    /// <summary>
    /// One task in each due group the list shows (overdue, today, this week,
    /// no date, completed), two events in the dashboard's seven-day window,
    /// and a three-day streak that includes today's completed task. Times are
    /// in the guest's own time zone, so "today" is the guest's today.
    /// </summary>
    private void Seed(Guid ownerId, TimeZoneInfo zone, string theme, DateTimeOffset now)
    {
        var local = TimeZoneInfo.ConvertTime(now, zone);
        var today = DateOnly.FromDateTime(local.DateTime);
        var midnight = At(today.AddDays(1), 0, 0);

        TaskItem Task(string title, TaskPriority priority, DateTimeOffset? dueAt, DateTimeOffset? completedAt = null) => new()
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Title = title,
            Priority = priority,
            DueAt = dueAt,
            CompletedAt = completedAt,
            CreatedAt = now,
            UpdatedAt = now,
        };

        CalendarEvent Event(string title, DateOnly day, int hour, int minutes) => new()
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Title = title,
            StartsAt = At(day, hour, 0),
            EndsAt = At(day, hour, 0).AddMinutes(minutes),
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Tasks.AddRange(
            Task("Reply to the venue about Friday", TaskPriority.High, At(today.AddDays(-1), 17, 0)),
            // Halfway to midnight is always still today, whatever the hour.
            Task("Review the weekly plan", TaskPriority.Medium, Truncate(now + (midnight - now) / 2)),
            Task("Book a dentist appointment", TaskPriority.Low, At(today.AddDays(3), 10, 0)),
            Task("Read chapter four", TaskPriority.Low, null),
            Task("Morning walk", TaskPriority.Medium, null, completedAt: now));

        db.Events.AddRange(
            Event("Team check-in", today.AddDays(1), 10, 30),
            Event("Lunch with Sam", today.AddDays(2), 13, 60));

        db.Settings.Add(new UserSettings { UserId = ownerId, Data = new SettingsData { TimeZone = zone.Id, Theme = theme }, UpdatedAt = now });
        db.Streaks.Add(new Streak
        {
            UserId = ownerId,
            CurrentLength = 3,
            LongestLength = 5,
            Points = 50,
            // The streak's own clock decides its "today", as it does on read.
            LastCompletedOn = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(streakClock.GetUtcNow(), zone).DateTime),
            UpdatedAt = now,
        });

        DateTimeOffset At(DateOnly day, int hour, int minute) =>
            new(TimeZoneInfo.ConvertTimeToUtc(day.ToDateTime(new TimeOnly(hour, minute)), zone), TimeSpan.Zero);
    }

    private static DateTimeOffset Truncate(DateTimeOffset value) =>
        new(value.Ticks - value.Ticks % TimeSpan.TicksPerMinute, value.Offset);
}
