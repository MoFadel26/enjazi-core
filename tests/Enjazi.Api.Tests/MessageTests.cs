using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class MessageTests(ApiFactory factory)
{
    [Fact]
    public async Task Members_send_and_read_in_chronological_order()
    {
        var (alice, aliceUser) = await factory.SignUpAsync();
        var (bob, bobUser) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(alice);
        await bob.PostAsync($"/api/rooms/{room.Id}/members", content: null);

        var first = await alice.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("hello"));
        var second = await bob.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("  hi back  "));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);

        var messages = await bob.GetFromJsonAsync<List<MessageResponse>>($"/api/rooms/{room.Id}/messages");

        Assert.Equal(2, messages!.Count);
        Assert.Equal(aliceUser.Id, messages[0].AuthorId);
        Assert.Equal("Test User", messages[0].AuthorName);
        Assert.Equal(bobUser.Id, messages[1].AuthorId);
        Assert.Equal("hi back", messages[1].Body);
    }

    [Fact]
    public async Task Non_members_get_404_reading_and_sending()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (mallory, _) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(alice);
        await alice.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("private"));

        var read = await mallory.GetAsync($"/api/rooms/{room.Id}/messages");
        var send = await mallory.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("let me in"));

        Assert.Equal(HttpStatusCode.NotFound, read.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, send.StatusCode);
        var messages = await alice.GetFromJsonAsync<List<MessageResponse>>($"/api/rooms/{room.Id}/messages");
        Assert.Single(messages!);
    }

    [Fact]
    public async Task A_removed_member_loses_the_history()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, bobUser) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(alice);
        await bob.PostAsync($"/api/rooms/{room.Id}/members", content: null);
        await bob.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("I was here"));

        await alice.DeleteAsync($"/api/rooms/{room.Id}/members/{bobUser.Id}");

        Assert.Equal(HttpStatusCode.NotFound, (await bob.GetAsync($"/api/rooms/{room.Id}/messages")).StatusCode);
    }

    [Fact]
    public async Task Blank_messages_are_400()
    {
        var (alice, _) = await factory.SignUpAsync();
        var room = await CreateRoomAsync(alice);

        var response = await alice.PostAsJsonAsync($"/api/rooms/{room.Id}/messages", new SendMessageRequest("   "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<RoomResponse> CreateRoomAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest("Chat", null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RoomResponse>())!;
    }
}
