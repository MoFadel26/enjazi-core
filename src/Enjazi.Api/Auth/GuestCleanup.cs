using Enjazi.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Auth;

/// <summary>
/// Deletes expired guests every 15 minutes (ADR-0017). One DELETE on users;
/// every table that references a user does so with ON DELETE CASCADE, so the
/// guest's tasks, events, settings, streak, room memberships and messages go
/// in the same statement and nothing is left pointing at a missing row.
/// Expiry itself is enforced when a guest token is checked; this only reclaims
/// the rows, so a missed run (the app scaled to zero) costs disk, not access.
/// </summary>
public sealed class GuestCleanup(IServiceScopeFactory scopes, ILogger<GuestCleanup> logger) : BackgroundService
{
    public static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    // The first run waits a minute: long enough that build-time OpenAPI
    // generation, which starts the host with no database, is long gone, and
    // short enough to run in every wake of an app that scales to zero.
    private static readonly TimeSpan FirstRun = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(FirstRun, stoppingToken);
            using var timer = new PeriodicTimer(Interval);
            do
            {
                try
                {
                    using var scope = scopes.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var deleted = await DeleteExpiredAsync(db, DateTimeOffset.UtcNow, stoppingToken);
                    if (deleted > 0)
                    {
                        logger.LogInformation("Deleted {Count} expired guest accounts", deleted);
                    }
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    logger.LogError(e, "Deleting expired guest accounts failed");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException)
        {
        }
    }

    /// <summary>Public so a test can run one pass without waiting for the timer.</summary>
    public static Task<int> DeleteExpiredAsync(AppDbContext db, DateTimeOffset now, CancellationToken cancellationToken = default) =>
        db.Users.Where(u => u.IsGuest && u.ExpiresAt <= now).ExecuteDeleteAsync(cancellationToken);
}
