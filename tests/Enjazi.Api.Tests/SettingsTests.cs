using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;

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
        Assert.Equal("UTC", settings.TimeZone);
        Assert.True(settings.Notifications.EmailTaskReminders);
    }

    [Fact]
    public async Task Put_replaces_the_tree_and_is_private_to_the_caller()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();

        var response = await alice.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "dark", "Asia/Riyadh", new NotificationSettingsContract(false, true, false)));
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
            "neon", "UTC", new NotificationSettingsContract(true, true, true)));
        var badZone = await client.PutAsJsonAsync("/api/settings", new SettingsRequest(
            "light", "Mars/Olympus_Mons", new NotificationSettingsContract(true, true, true)));

        Assert.Equal(HttpStatusCode.BadRequest, badTheme.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badZone.StatusCode);
    }
}
