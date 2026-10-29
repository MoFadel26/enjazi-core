using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class EventTests(ApiFactory factory)
{
    private static readonly DateTimeOffset Monday = new(2026, 10, 5, 9, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Create_then_get_round_trips()
    {
        var (client, _) = await factory.SignUpAsync();

        var created = await CreateAsync(client, "Standup", Monday, Monday.AddMinutes(15));
        var fetched = await client.GetFromJsonAsync<EventResponse>($"/api/events/{created.Id}");

        Assert.Equal(created, fetched);
    }

    [Fact]
    public async Task Another_users_event_is_404_on_get_put_and_delete()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();
        var bobs = await CreateAsync(bob, "Bob's review", Monday, Monday.AddHours(1));

        Assert.Equal(HttpStatusCode.NotFound, (await alice.GetAsync($"/api/events/{bobs.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await alice.PutAsJsonAsync($"/api/events/{bobs.Id}",
            new UpdateEventRequest("Hijacked", null, Monday, Monday.AddHours(1), false))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await alice.DeleteAsync($"/api/events/{bobs.Id}")).StatusCode);
    }

    [Fact]
    public async Task List_returns_events_overlapping_the_window_in_start_order()
    {
        var (client, _) = await factory.SignUpAsync();
        var before = await CreateAsync(client, "before", Monday.AddDays(-2), Monday.AddDays(-2).AddHours(1));
        var spanning = await CreateAsync(client, "spanning", Monday.AddHours(-1), Monday.AddHours(2));
        var inside = await CreateAsync(client, "inside", Monday.AddHours(3), Monday.AddHours(4));
        var after = await CreateAsync(client, "after", Monday.AddDays(2), Monday.AddDays(2).AddHours(1));

        var from = Uri.EscapeDataString(Monday.ToString("o"));
        var to = Uri.EscapeDataString(Monday.AddHours(8).ToString("o"));
        var listed = (await client.GetFromJsonAsync<List<EventResponse>>($"/api/events?from={from}&to={to}"))!;

        Assert.Equal([spanning.Id, inside.Id], listed.Select(e => e.Id));
        Assert.DoesNotContain(listed, e => e.Id == before.Id || e.Id == after.Id);
    }

    [Fact]
    public async Task Update_and_delete_work_for_the_owner()
    {
        var (client, _) = await factory.SignUpAsync();
        var created = await CreateAsync(client, "Draft", Monday, Monday.AddHours(1));

        var updated = await client.PutAsJsonAsync($"/api/events/{created.Id}",
            new UpdateEventRequest("Final", "notes", Monday, Monday.AddHours(2), false));
        var body = await updated.Content.ReadFromJsonAsync<EventResponse>();
        Assert.Equal("Final", body!.Title);
        Assert.Equal(Monday.AddHours(2), body.EndsAt);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/events/{created.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/events/{created.Id}")).StatusCode);
    }

    [Fact]
    public async Task An_event_ending_before_it_starts_is_400()
    {
        var (client, _) = await factory.SignUpAsync();

        var response = await client.PostAsJsonAsync("/api/events",
            new CreateEventRequest("Backwards", null, Monday, Monday.AddHours(-1), false));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<EventResponse> CreateAsync(
        HttpClient client, string title, DateTimeOffset startsAt, DateTimeOffset endsAt)
    {
        var response = await client.PostAsJsonAsync("/api/events",
            new CreateEventRequest(title, null, startsAt, endsAt, false));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<EventResponse>())!;
    }
}
