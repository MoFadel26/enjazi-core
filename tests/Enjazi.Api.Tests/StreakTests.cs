using System.Net.Http.Json;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data.Entities;

namespace Enjazi.Api.Tests;

/// <summary>
/// The Phase 6 check from docs/plan.md: a completed day increments the
/// streak and a missed day resets it. Days are moved with the fake clock.
/// </summary>
[Collection(nameof(ApiCollection))]
public sealed class StreakTests(ApiFactory factory)
{
    [Fact]
    public async Task Consecutive_days_grow_the_streak_and_a_missed_day_resets_it()
    {
        var (client, _) = await factory.SignUpAsync();
        factory.Clock.Now = new DateTimeOffset(2026, 3, 10, 12, 0, 0, TimeSpan.Zero);

        Assert.Equal(new StreakResponse(0, 0, 0, null, false), await ReadAsync(client));

        await CompleteATaskAsync(client);
        Assert.Equal(new StreakResponse(1, 1, 10, new DateOnly(2026, 3, 10), true), await ReadAsync(client));

        // A second completion on the same day: points, not length.
        await CompleteATaskAsync(client);
        Assert.Equal(new StreakResponse(1, 1, 20, new DateOnly(2026, 3, 10), true), await ReadAsync(client));

        factory.Clock.Now = factory.Clock.Now.AddDays(1);
        await CompleteATaskAsync(client);
        Assert.Equal(new StreakResponse(2, 2, 30, new DateOnly(2026, 3, 11), true), await ReadAsync(client));

        // Nothing on the 12th. On the 13th the run reads as broken before
        // anything is written, and the next completion starts over at one.
        factory.Clock.Now = factory.Clock.Now.AddDays(2);
        Assert.Equal(new StreakResponse(0, 2, 30, new DateOnly(2026, 3, 11), false), await ReadAsync(client));

        await CompleteATaskAsync(client);
        Assert.Equal(new StreakResponse(1, 2, 40, new DateOnly(2026, 3, 13), true), await ReadAsync(client));
    }

    [Fact]
    public async Task Saving_an_already_completed_task_does_not_count_twice()
    {
        var (client, _) = await factory.SignUpAsync();
        factory.Clock.Now = new DateTimeOffset(2026, 4, 1, 12, 0, 0, TimeSpan.Zero);

        var task = await CompleteATaskAsync(client);
        await client.PutAsJsonAsync($"/api/tasks/{task.Id}", new UpdateTaskRequest(
            "renamed", null, TaskPriority.Low, null, Completed: true));

        Assert.Equal(10, (await ReadAsync(client)).Points);
    }

    [Fact]
    public async Task Today_is_the_users_time_zone_not_UTC()
    {
        var (client, _) = await factory.SignUpAsync();
        await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "system", "Pacific/Auckland", new NotificationSettingsContract(true, true, true)));

        // 23:00 UTC on the 10th is already the 11th in Auckland.
        factory.Clock.Now = new DateTimeOffset(2026, 3, 10, 23, 0, 0, TimeSpan.Zero);
        await CompleteATaskAsync(client);

        Assert.Equal(new DateOnly(2026, 3, 11), (await ReadAsync(client)).LastCompletedOn);
    }

    private static Task<StreakResponse> ReadAsync(HttpClient client) =>
        client.GetFromJsonAsync<StreakResponse>("/api/streak")!;

    private static async Task<TaskResponse> CompleteATaskAsync(HttpClient client)
    {
        var created = await client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            "Do the thing", null, TaskPriority.Medium, null));
        var task = (await created.Content.ReadFromJsonAsync<TaskResponse>(Json.Web))!;

        var updated = await client.PutAsJsonAsync($"/api/tasks/{task.Id}", new UpdateTaskRequest(
            task.Title, task.Description, task.Priority, task.DueAt, Completed: true));
        updated.EnsureSuccessStatusCode();
        return (await updated.Content.ReadFromJsonAsync<TaskResponse>(Json.Web))!;
    }
}
