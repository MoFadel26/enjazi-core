using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Streaks;

/// <summary>The DI key of the clock the streak reads. See Program.cs.</summary>
public static class StreakClock
{
    public const string Key = "streak-clock";
}

/// <summary>
/// The streak rule, in one place. A day counts when at least one task is
/// completed on it, measured in the user's time zone from settings, and
/// "today" comes from <see cref="TimeProvider"/> so a test can move the
/// calendar. Completing a second task on the same day adds points but not
/// length. A day with no completion breaks the run; the break is visible in
/// reads at once and written to the row by the next completion.
/// </summary>
public sealed class StreakService(
    AppDbContext db,
    ICurrentUser currentUser,
    [FromKeyedServices(StreakClock.Key)] TimeProvider clock)
{
    public const int PointsPerCompletion = 10;

    /// <summary>Called when a task goes from open to completed. Does not save.</summary>
    public async Task RecordCompletionAsync()
    {
        var today = await TodayAsync();
        var streak = await db.Streaks.FirstOrDefaultAsync();
        if (streak is null)
        {
            streak = new Streak { UserId = currentUser.Id };
            db.Streaks.Add(streak);
        }

        if (streak.LastCompletedOn != today)
        {
            streak.CurrentLength = streak.LastCompletedOn == today.AddDays(-1)
                ? streak.CurrentLength + 1
                : 1;
            streak.LongestLength = Math.Max(streak.LongestLength, streak.CurrentLength);
            streak.LastCompletedOn = today;
        }

        streak.Points += PointsPerCompletion;
        streak.UpdatedAt = clock.GetUtcNow();
    }

    public async Task<StreakResponse> ReadAsync()
    {
        var today = await TodayAsync();
        var streak = await db.Streaks.FirstOrDefaultAsync();
        if (streak is null)
        {
            return new StreakResponse(0, 0, 0, null, false);
        }

        // Alive only if the last completion was today or yesterday.
        var alive = streak.LastCompletedOn == today || streak.LastCompletedOn == today.AddDays(-1);
        return new StreakResponse(
            alive ? streak.CurrentLength : 0,
            streak.LongestLength,
            streak.Points,
            streak.LastCompletedOn,
            CompletedToday: streak.LastCompletedOn == today);
    }

    /// <summary>
    /// The calendar day in the user's time zone. Settings may not exist yet
    /// (they are created on first read), in which case UTC, which is also the
    /// settings default. The zone was validated when it was written.
    /// </summary>
    private async Task<DateOnly> TodayAsync()
    {
        var zoneId = await db.Settings.Select(s => s.Data.TimeZone).FirstOrDefaultAsync() ?? "UTC";
        var zone = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone).DateTime);
    }
}
