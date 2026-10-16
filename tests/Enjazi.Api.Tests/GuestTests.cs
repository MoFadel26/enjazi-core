using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Enjazi.Api.Tests;

/// <summary>Guest mode, ADR-0017.</summary>
[Collection(nameof(ApiCollection))]
public sealed class GuestTests(ApiFactory factory)
{
    [Fact]
    public async Task A_guest_starts_with_a_seven_day_account_and_sample_data()
    {
        var before = DateTimeOffset.UtcNow;
        var (client, session, me) = await factory.StartGuestAsync();

        Assert.True(me.IsGuest);
        Assert.Empty(me.Roles);
        Assert.Equal(session.ExpiresAt, me.ExpiresAt);
        Assert.InRange(session.ExpiresAt, before.AddDays(7).AddMinutes(-1), DateTimeOffset.UtcNow.AddDays(7).AddMinutes(1));

        var tasks = (await client.GetFromJsonAsync<List<TaskResponse>>("/api/tasks", Json.Web))!;
        Assert.Equal(5, tasks.Count);
        Assert.Single(tasks, t => t.CompletedAt is not null);
        Assert.Single(tasks, t => t.CompletedAt is null && t.DueAt < DateTimeOffset.UtcNow);

        var from = DateTimeOffset.UtcNow.ToString("O");
        var to = DateTimeOffset.UtcNow.AddDays(7).ToString("O");
        var events = await client.GetFromJsonAsync<List<EventResponse>>(
            $"/api/events?from={Uri.EscapeDataString(from)}&to={Uri.EscapeDataString(to)}");
        Assert.Equal(2, events!.Count);

        var streak = await client.GetFromJsonAsync<StreakResponse>("/api/streak");
        Assert.Equal(3, streak!.CurrentLength);
        Assert.True(streak.CompletedToday);
    }

    [Theory]
    [InlineData("dark", "dark")]
    [InlineData("light", "light")]
    [InlineData("sepia", "system")]
    [InlineData(null, "system")]
    public async Task A_guest_starts_with_the_theme_picked_on_the_landing_page(string? picked, string expected)
    {
        var response = await factory.PostGuestAsync(SignedInClient.NewAddress(), theme: picked);
        response.EnsureSuccessStatusCode();
        var session = (await response.Content.ReadFromJsonAsync<GuestSessionResponse>())!;
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.Token);

        var settings = await client.GetFromJsonAsync<SettingsResponse>("/api/settings");
        Assert.Equal(expected, settings!.Theme);
    }

    [Fact]
    public async Task Guest_creation_is_limited_to_five_an_hour_per_address()
    {
        var address = SignedInClient.NewAddress();
        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await factory.PostGuestAsync(address)).StatusCode);
        }

        var refused = await factory.PostGuestAsync(address);
        Assert.Equal(HttpStatusCode.TooManyRequests, refused.StatusCode);
        Assert.True(refused.Headers.RetryAfter is not null);

        Assert.Equal(HttpStatusCode.OK, (await factory.PostGuestAsync(SignedInClient.NewAddress())).StatusCode);
    }

    [Fact]
    public async Task A_guest_can_join_and_chat_but_cannot_create_a_room()
    {
        var (member, _) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(member);
        var (guest, _, _) = await factory.StartGuestAsync();

        var create = await guest.PostAsJsonAsync("/api/rooms", new CreateRoomRequest("Guest room", null));
        Assert.Equal(HttpStatusCode.Forbidden, create.StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await guest.PostAsync($"/api/rooms/{room.Id}/members", null)).StatusCode);
        var sent = await guest.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("Hello from a guest"));
        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
    }

    [Fact]
    public async Task A_guest_cannot_reach_the_admin_panel()
    {
        var (guest, _, me) = await factory.StartGuestAsync();

        Assert.Equal(HttpStatusCode.Forbidden, (await guest.GetAsync("/api/admin/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await guest.GetAsync($"/api/admin/users/{me.Id}")).StatusCode);
    }

    [Fact]
    public async Task A_guest_is_never_promoted()
    {
        var (_, _, guest) = await factory.StartGuestAsync();

        using (var scope = factory.Services.CreateScope())
        {
            Assert.False(await AdminBootstrap.PromoteAsync(scope.ServiceProvider, guest.Email));
        }

        var (admin, _) = await factory.SignUpAdminAsync();
        var update = await admin.PutAsJsonAsync($"/api/admin/users/{guest.Id}", new AdminUpdateUserRequest(false, [Roles.Admin]));
        Assert.Equal(HttpStatusCode.BadRequest, update.StatusCode);
    }

    [Fact]
    public async Task A_token_refreshes_while_the_guest_lives_and_an_expired_guest_gets_401()
    {
        var (client, session, me) = await factory.StartGuestAsync();
        var anonymous = factory.CreateHttpsClient();

        var refreshed = await anonymous.PostAsJsonAsync("/api/auth/guest/refresh", new RefreshGuestRequest(session.Token));
        Assert.Equal(HttpStatusCode.OK, refreshed.StatusCode);
        Assert.Equal(session.ExpiresAt, (await refreshed.Content.ReadFromJsonAsync<GuestSessionResponse>())!.ExpiresAt);

        await ExpireAsync(me.Id);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonymous.PostAsJsonAsync("/api/auth/guest/refresh", new RefreshGuestRequest(session.Token))).StatusCode);
    }

    [Fact]
    public async Task A_guest_token_naming_a_real_user_is_401()
    {
        var (_, member) = await factory.SignUpAsync();
        var tokens = factory.Services.GetRequiredService<GuestTokens>();
        var forged = tokens.Create(new User { Id = member.Id }, DateTimeOffset.UtcNow);

        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", forged);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Cleanup_deletes_an_expired_guest_and_everything_it_owns()
    {
        var (member, memberUser) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(member);
        var (guest, _, me) = await factory.StartGuestAsync();
        var (_, _, alive) = await factory.StartGuestAsync();
        await guest.PostAsync($"/api/rooms/{room.Id}/members", null);
        await guest.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("Soon gone"));
        await ExpireAsync(me.Id);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await GuestCleanup.DeleteExpiredAsync(db, DateTimeOffset.UtcNow) >= 1);

        Assert.False(await db.Users.AnyAsync(u => u.Id == me.Id));
        Assert.False(await db.Tasks.IgnoreQueryFilters().AnyAsync(t => t.OwnerId == me.Id));
        Assert.False(await db.Events.IgnoreQueryFilters().AnyAsync(e => e.OwnerId == me.Id));
        Assert.False(await db.Settings.IgnoreQueryFilters().AnyAsync(s => s.UserId == me.Id));
        Assert.False(await db.Streaks.IgnoreQueryFilters().AnyAsync(s => s.UserId == me.Id));
        Assert.False(await db.RoomMembers.AnyAsync(m => m.UserId == me.Id));
        Assert.False(await db.Messages.IgnoreQueryFilters().AnyAsync(m => m.AuthorId == me.Id));

        // Only the expired guest: the room, its owner and a live guest stay.
        Assert.True(await db.Rooms.AnyAsync(r => r.Id == room.Id));
        Assert.True(await db.RoomMembers.AnyAsync(m => m.RoomId == room.Id && m.UserId == memberUser.Id));
        Assert.True(await db.Users.AnyAsync(u => u.Id == alive.Id));
    }

    [Fact]
    public async Task Signing_up_with_the_guest_token_keeps_the_guests_data()
    {
        var (guest, session, me) = await factory.StartGuestAsync();
        await guest.PostAsJsonAsync("/api/tasks", new CreateTaskRequest("Made as a guest", null, TaskPriority.Medium, null));

        var email = $"upgraded-{Guid.NewGuid():n}@example.test";
        var account = ClerkClient(email, session.Token);
        var upgraded = (await account.GetFromJsonAsync<UserResponse>("/api/auth/me"))!;

        Assert.Equal(me.Id, upgraded.Id);
        Assert.False(upgraded.IsGuest);
        Assert.Null(upgraded.ExpiresAt);
        Assert.Equal(email, upgraded.Email);
        var tasks = (await account.GetFromJsonAsync<List<TaskResponse>>("/api/tasks", Json.Web))!;
        Assert.Contains(tasks, t => t.Title == "Made as a guest");

        // The row is no longer a guest, so the guest token no longer works.
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task An_expired_guest_token_gives_a_new_empty_account()
    {
        var (_, session, me) = await factory.StartGuestAsync();
        await ExpireAsync(me.Id);

        var account = ClerkClient($"late-{Guid.NewGuid():n}@example.test", session.Token);
        var user = (await account.GetFromJsonAsync<UserResponse>("/api/auth/me"))!;

        Assert.NotEqual(me.Id, user.Id);
        Assert.Empty((await account.GetFromJsonAsync<List<TaskResponse>>("/api/tasks", Json.Web))!);
    }

    [Fact]
    public async Task An_existing_account_does_not_take_over_a_guest()
    {
        var clerkUserId = TestTokens.NewClerkUserId();
        var email = $"existing-{Guid.NewGuid():n}@example.test";
        var first = ClerkClient(email, null, clerkUserId);
        var existing = (await first.GetFromJsonAsync<UserResponse>("/api/auth/me"))!;
        var (guest, session, me) = await factory.StartGuestAsync();

        var again = ClerkClient(email, session.Token, clerkUserId);
        var user = (await again.GetFromJsonAsync<UserResponse>("/api/auth/me"))!;

        Assert.Equal(existing.Id, user.Id);
        Assert.Equal(HttpStatusCode.OK, (await guest.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Room_messages_are_limited_to_thirty_a_minute_per_user()
    {
        var (member, _) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(member);
        var (guest, _, _) = await factory.StartGuestAsync();
        await guest.PostAsync($"/api/rooms/{room.Id}/members", null);

        for (var i = 0; i < RateLimits.MessagesPerMinute; i++)
        {
            var sent = await guest.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest($"Message {i}"));
            Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        }

        var refused = await guest.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("One too many"));
        Assert.Equal(HttpStatusCode.TooManyRequests, refused.StatusCode);

        // Per user: the room's owner is not held back by the guest.
        var other = await member.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("Still fine"));
        Assert.Equal(HttpStatusCode.Created, other.StatusCode);
    }

    private HttpClient ClerkClient(string email, string? guestToken, string? clerkUserId = null)
    {
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            TestTokens.Create(clerkUserId ?? TestTokens.NewClerkUserId(), email));
        if (guestToken is not null)
        {
            client.DefaultRequestHeaders.Add(GuestAuthentication.UpgradeHeader, guestToken);
        }

        return client;
    }

    private async Task ExpireAsync(Guid guestId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Users.Where(u => u.Id == guestId)
            .ExecuteUpdateAsync(set => set.SetProperty(u => u.ExpiresAt, DateTimeOffset.UtcNow.AddMinutes(-1)));
    }

    private static async Task<RoomResponse> CreateRoomAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest($"Room {Guid.NewGuid():n}", null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RoomResponse>())!;
    }
}
