using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data.Entities;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class RoomTests(ApiFactory factory)
{
    [Fact]
    public async Task Creating_a_room_makes_the_creator_its_admin_member()
    {
        var (client, user) = await factory.SignUpAsync();

        var room = await CreateAsync(client, "Study group");
        var members = await client.GetFromJsonAsync<List<RoomMemberResponse>>($"/api/rooms/{room.Id}/members", Json.Web);

        Assert.True(room.IsMember);
        Assert.Equal(1, room.MemberCount);
        var only = Assert.Single(members!);
        Assert.Equal(user.Id, only.UserId);
        Assert.Equal(RoomRole.Admin, only.Role);
    }

    [Fact]
    public async Task Rooms_are_listed_to_everyone_with_membership_marked()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();
        var room = await CreateAsync(alice, "Alice's room");

        var seenByBob = (await bob.GetFromJsonAsync<List<RoomResponse>>("/api/rooms"))!
            .Single(r => r.Id == room.Id);
        var detail = await bob.GetFromJsonAsync<RoomResponse>($"/api/rooms/{room.Id}");

        Assert.False(seenByBob.IsMember);
        Assert.False(detail!.IsMember);
        Assert.Equal(1, detail.MemberCount);
    }

    [Fact]
    public async Task Members_are_hidden_from_non_members_and_visible_after_joining()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, bobUser) = await factory.SignUpAsync();
        var room = await CreateAsync(alice, "Joinable");

        Assert.Equal(HttpStatusCode.NotFound,
            (await bob.GetAsync($"/api/rooms/{room.Id}/members")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent,
            (await bob.PostAsync($"/api/rooms/{room.Id}/members", content: null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent,
            (await bob.PostAsync($"/api/rooms/{room.Id}/members", content: null)).StatusCode);

        var members = await bob.GetFromJsonAsync<List<RoomMemberResponse>>($"/api/rooms/{room.Id}/members", Json.Web);
        Assert.Equal(2, members!.Count);
        Assert.Equal(RoomRole.Member, members.Single(m => m.UserId == bobUser.Id).Role);
    }

    [Fact]
    public async Task Joining_a_room_that_does_not_exist_is_404()
    {
        var (client, _) = await factory.SignUpAsync();

        Assert.Equal(HttpStatusCode.NotFound,
            (await client.PostAsync($"/api/rooms/{Guid.NewGuid()}/members", content: null)).StatusCode);
    }

    [Fact]
    public async Task Only_a_room_admin_can_rename_or_delete_it()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();
        var room = await CreateAsync(alice, "Original");
        await bob.PostAsync($"/api/rooms/{room.Id}/members", content: null);

        var rename = new UpdateRoomRequest("Renamed", null);
        Assert.Equal(HttpStatusCode.NotFound,
            (await bob.PutAsJsonAsync($"/api/rooms/{room.Id}", rename)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await bob.DeleteAsync($"/api/rooms/{room.Id}")).StatusCode);

        var renamed = await alice.PutAsJsonAsync($"/api/rooms/{room.Id}", rename);
        Assert.Equal("Renamed", (await renamed.Content.ReadFromJsonAsync<RoomResponse>())!.Name);

        Assert.Equal(HttpStatusCode.NoContent, (await alice.DeleteAsync($"/api/rooms/{room.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.GetAsync($"/api/rooms/{room.Id}")).StatusCode);
    }

    [Fact]
    public async Task A_member_can_leave_and_an_admin_can_remove_a_member()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, bobUser) = await factory.SignUpAsync();
        var (carol, carolUser) = await factory.SignUpAsync();
        var room = await CreateAsync(alice, "Revolving door");
        await bob.PostAsync($"/api/rooms/{room.Id}/members", content: null);
        await carol.PostAsync($"/api/rooms/{room.Id}/members", content: null);

        // Bob cannot remove Carol; Alice can. Carol can leave on her own.
        Assert.Equal(HttpStatusCode.NotFound,
            (await bob.DeleteAsync($"/api/rooms/{room.Id}/members/{carolUser.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent,
            (await alice.DeleteAsync($"/api/rooms/{room.Id}/members/{carolUser.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent,
            (await bob.DeleteAsync($"/api/rooms/{room.Id}/members/{bobUser.Id}")).StatusCode);

        var detail = await alice.GetFromJsonAsync<RoomResponse>($"/api/rooms/{room.Id}");
        Assert.Equal(1, detail!.MemberCount);
    }

    [Fact]
    public async Task The_creator_cannot_leave_their_own_room()
    {
        var (alice, aliceUser) = await factory.SignUpAsync();
        var room = await CreateAsync(alice, "Sticky");

        var response = await alice.DeleteAsync($"/api/rooms/{room.Id}/members/{aliceUser.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<RoomResponse> CreateAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest(name, null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RoomResponse>())!;
    }
}
