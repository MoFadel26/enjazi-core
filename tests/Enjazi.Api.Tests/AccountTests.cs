using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Enjazi.Api.Tests;

/// <summary>Deleting your own account, ADR-0019.</summary>
[Collection(nameof(ApiCollection))]
public sealed class AccountTests(ApiFactory factory)
{
    [Fact]
    public async Task Deleting_an_account_removes_what_it_owns_and_its_Clerk_user()
    {
        var (client, me) = await factory.SignUpAsync();
        await client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest("Mine", null, TaskPriority.Medium, null));
        var clerkUserId = await ClerkUserIdAsync(me.Id);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/auth/me")).StatusCode);

        Assert.Contains(clerkUserId, factory.Clerk.Deleted);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await db.Users.AnyAsync(u => u.Id == me.Id));
        Assert.False(await db.Tasks.IgnoreQueryFilters().AnyAsync(t => t.OwnerId == me.Id));
        Assert.False(await db.Settings.IgnoreQueryFilters().AnyAsync(s => s.UserId == me.Id));
    }

    [Fact]
    public async Task A_room_passes_to_the_member_who_joined_earliest()
    {
        var (owner, ownerUser) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(owner);
        var (first, firstUser) = await factory.SignUpAsync();
        var (second, _) = await factory.SignUpAsync();
        await first.PostAsync($"/api/rooms/{room.Id}/members", null);
        await second.PostAsync($"/api/rooms/{room.Id}/members", null);
        var empty = await CreateRoomAsync(owner);

        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync("/api/auth/me")).StatusCode);

        var kept = (await first.GetFromJsonAsync<RoomResponse>($"/api/rooms/{room.Id}", Json.Web))!;
        Assert.Equal(firstUser.Id, kept.OwnerId);
        var members = (await first.GetFromJsonAsync<List<RoomMemberResponse>>($"/api/rooms/{room.Id}/members", Json.Web))!;
        Assert.DoesNotContain(members, m => m.UserId == ownerUser.Id);
        Assert.Equal(RoomRole.Admin, members.Single(m => m.UserId == firstUser.Id).Role);

        // The heir runs the room now: renaming it is an admin's action.
        var renamed = await first.PutAsJsonAsync($"/api/rooms/{room.Id}", new UpdateRoomRequest("Renamed by the heir", null));
        Assert.Equal(HttpStatusCode.OK, renamed.StatusCode);

        // A room with no one else in it goes.
        Assert.Equal(HttpStatusCode.NotFound, (await first.GetAsync($"/api/rooms/{empty.Id}")).StatusCode);
    }

    [Fact]
    public async Task Messages_stay_in_the_room_without_an_author()
    {
        var (owner, _) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(owner);
        var (leaving, _) = await factory.SignUpAsync();
        await leaving.PostAsync($"/api/rooms/{room.Id}/members", null);
        await leaving.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("Still here after I go"));

        Assert.Equal(HttpStatusCode.NoContent, (await leaving.DeleteAsync("/api/auth/me")).StatusCode);

        var messages = (await owner.GetFromJsonAsync<List<MessageResponse>>($"/api/rooms/{room.Id}/messages", Json.Web))!;
        var kept = Assert.Single(messages, m => m.Body == "Still here after I go");
        Assert.Null(kept.AuthorId);
        Assert.Null(kept.AuthorName);
    }

    [Fact]
    public async Task Nothing_is_deleted_when_Clerk_refuses()
    {
        var (client, me) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(client);

        factory.Clerk.Fail = true;
        try
        {
            Assert.Equal(HttpStatusCode.BadGateway, (await client.DeleteAsync("/api/auth/me")).StatusCode);
        }
        finally
        {
            factory.Clerk.Fail = false;
        }

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await db.Users.AnyAsync(u => u.Id == me.Id));
        Assert.True(await db.Rooms.AnyAsync(r => r.Id == room.Id && r.OwnerId == me.Id));
    }

    [Fact]
    public async Task A_guest_deletes_its_account_and_its_messages()
    {
        var (owner, _) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(owner);
        var (guest, _, me) = await factory.StartGuestAsync();
        await guest.PostAsync($"/api/rooms/{room.Id}/members", null);
        await guest.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("From a guest"));
        var clerkCalls = factory.Clerk.Deleted.Count;

        Assert.Equal(HttpStatusCode.NoContent, (await guest.DeleteAsync("/api/auth/me")).StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(clerkCalls, factory.Clerk.Deleted.Count);
        var messages = (await owner.GetFromJsonAsync<List<MessageResponse>>($"/api/rooms/{room.Id}/messages", Json.Web))!;
        Assert.DoesNotContain(messages, m => m.Body == "From a guest");
    }

    [Fact]
    public async Task The_last_admin_cannot_delete_their_account()
    {
        var (client, me) = await factory.SignUpAdminAsync();

        // Other tests leave admins behind in the shared database. Set them
        // aside so this one is the only admin, and put them back after.
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var others = (await users.GetUsersInRoleAsync(Roles.Admin)).Where(u => u.Id != me.Id).ToList();
        foreach (var other in others)
        {
            await users.RemoveFromRoleAsync(other, Roles.Admin);
        }

        try
        {
            var refused = await client.DeleteAsync("/api/auth/me");
            Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
            var problem = await refused.Content.ReadFromJsonAsync<ProblemDetails>();
            Assert.StartsWith("You are the only admin.", problem!.Title);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);

            // With a second admin, the first can go.
            await factory.SignUpAdminAsync();
            Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/auth/me")).StatusCode);
        }
        finally
        {
            foreach (var other in others)
            {
                await users.AddToRoleAsync(other, Roles.Admin);
            }
        }
    }

    private async Task<string> ClerkUserIdAsync(Guid userId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Users.SingleAsync(u => u.Id == userId)).ClerkUserId!;
    }

    private static async Task<RoomResponse> CreateRoomAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest($"Room {Guid.NewGuid():n}", null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RoomResponse>())!;
    }
}
