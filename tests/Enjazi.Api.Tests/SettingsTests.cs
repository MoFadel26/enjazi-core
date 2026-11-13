using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class SettingsTests(ApiFactory factory)
{
    [Fact]
    public async Task First_read_returns_defaults()
    {
        var (client, _) = await factory.SignUpAsync();

        var settings = await client.GetFromJsonAsync<SettingsResponse>("/api/settings");

        Assert.Equal("system", settings!.Theme);
        Assert.Equal("nord", settings.Palette);
        Assert.Equal("UTC", settings.TimeZone);
        Assert.True(settings.Notifications.EmailTaskReminders);
        Assert.True(settings.ShowCompletedTasksOnCalendar);
    }

    /// <summary>
    /// The calendar setting arrived after accounts already had settings rows.
    /// Such a row has no key for it in the jsonb, and has to read as the
    /// default rather than as false.
    /// </summary>
    [Fact]
    public async Task A_row_saved_before_the_calendar_setting_shows_completed_tasks()
    {
        var (client, me) = await factory.SignUpAsync();
        var hidden = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "dark", "nord", "UTC", new NotificationSettingsContract(true, true, true), false));
        hidden.EnsureSuccessStatusCode();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var removed = await db.Database.ExecuteSqlAsync(
                $"UPDATE settings SET data = data - 'ShowCompletedTasksOnCalendar' WHERE user_id = {me.Id}");
            Assert.Equal(1, removed);
        }

        var settings = await client.GetFromJsonAsync<SettingsResponse>("/api/settings");
        Assert.True(settings!.ShowCompletedTasksOnCalendar);
        Assert.Equal("dark", settings.Theme);
    }

    /// <summary>
    /// A page loaded before the setting existed sends the tree without it.
    /// Saving the theme from there must not change it.
    /// </summary>
    [Fact]
    public async Task A_save_without_the_calendar_setting_keeps_it()
    {
        var (client, _) = await factory.SignUpAsync();
        var hidden = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "system", "nord", "UTC", new NotificationSettingsContract(true, true, true), false));
        hidden.EnsureSuccessStatusCode();

        var response = await client.PutAsJsonAsync("/api/settings", new
        {
            theme = "dark",
            palette = "nord",
            timeZone = "UTC",
            notifications = new { emailTaskReminders = true, browserTaskReminders = true, roomMessages = true },
        });
        response.EnsureSuccessStatusCode();

        var settings = await client.GetFromJsonAsync<SettingsResponse>("/api/settings");
        Assert.Equal("dark", settings!.Theme);
        Assert.False(settings.ShowCompletedTasksOnCalendar);
    }

    [Fact]
    public async Task Completed_tasks_can_be_hidden_from_the_calendar_and_shown_again()
    {
        var (client, _) = await factory.SignUpAsync();
        var notifications = new NotificationSettingsContract(true, true, true);

        foreach (var show in new[] { false, true })
        {
            var response = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
                "system", "nord", "UTC", notifications, show));
            response.EnsureSuccessStatusCode();
            Assert.Equal(show, (await response.Content.ReadFromJsonAsync<SettingsResponse>())!.ShowCompletedTasksOnCalendar);

            var settings = await client.GetFromJsonAsync<SettingsResponse>("/api/settings");
            Assert.Equal(show, settings!.ShowCompletedTasksOnCalendar);
        }
    }

    [Fact]
    public async Task Put_replaces_the_tree_and_is_private_to_the_caller()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();

        var response = await alice.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "dark", "nord", "Asia/Riyadh", new NotificationSettingsContract(false, true, false), true));
        response.EnsureSuccessStatusCode();

        var alices = await alice.GetFromJsonAsync<SettingsResponse>("/api/settings");
        var bobs = await bob.GetFromJsonAsync<SettingsResponse>("/api/settings");

        Assert.Equal("dark", alices!.Theme);
        Assert.Equal("Asia/Riyadh", alices.TimeZone);
        Assert.False(alices.Notifications.EmailTaskReminders);
        Assert.Equal("system", bobs!.Theme);
    }

    [Fact]
    public async Task Unknown_theme_or_time_zone_is_400()
    {
        var (client, _) = await factory.SignUpAsync();

        var badTheme = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "neon", "enjazi", "UTC", new NotificationSettingsContract(true, true, true), true));
        var badZone = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "light", "enjazi", "Mars/Olympus_Mons", new NotificationSettingsContract(true, true, true), true));

        Assert.Equal(HttpStatusCode.BadRequest, badTheme.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badZone.StatusCode);
    }

    [Fact]
    public async Task Every_palette_can_be_saved()
    {
        var (client, _) = await factory.SignUpAsync();

        foreach (var palette in new[] { "enjazi", "nord", "solarized", "dracula" })
        {
            var response = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
                "system", palette, "UTC", new NotificationSettingsContract(true, true, true), true));
            response.EnsureSuccessStatusCode();

            var settings = await client.GetFromJsonAsync<SettingsResponse>("/api/settings");
            Assert.Equal(palette, settings!.Palette);
        }
    }

    [Fact]
    public async Task Unknown_palette_is_400()
    {
        var (client, _) = await factory.SignUpAsync();

        var response = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "system", "gruvbox", "UTC", new NotificationSettingsContract(true, true, true), true));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.Contains("Palette", problem!.Errors.Keys);
    }
}
