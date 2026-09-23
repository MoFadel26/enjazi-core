using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data.Entities;

namespace Enjazi.Api.Tests;

/// <summary>
/// The Phase 2 verification. The previous version of this application let any
/// authenticated user read and modify any task by id, because the controller
/// looked up the task without checking who owned it. These tests are the proof
/// that the same bug cannot be written here: TasksController does not check
/// ownership either, and does not need to, because the global query filter in
/// AppDbContext means another user's task is never returned to it.
/// </summary>
[Collection(nameof(ApiCollection))]
public sealed class TaskOwnershipTests(ApiFactory factory)
{
    [Fact]
    public async Task User_a_gets_404_fetching_user_bs_task()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();

        var bobsTask = await CreateTaskAsync(bob, "Bob's private task");

        var asAlice = await alice.GetAsync($"/api/tasks/{bobsTask.Id}");
        Assert.Equal(HttpStatusCode.NotFound, asAlice.StatusCode);

        // The same id fetched by its owner succeeds, so the 404 above is
        // ownership and not a wrong or deleted id.
        var asBob = await bob.GetAsync($"/api/tasks/{bobsTask.Id}");
        Assert.Equal(HttpStatusCode.OK, asBob.StatusCode);
    }

    [Fact]
    public async Task User_a_cannot_update_or_delete_user_bs_task()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();

        var bobsTask = await CreateTaskAsync(bob, "Bob's untouchable task");

        var update = await alice.PutAsJsonAsync($"/api/tasks/{bobsTask.Id}", new UpdateTaskRequest(
            Title: "Hijacked", Description: null, Priority: TaskPriority.High,
            DueAt: null, Completed: true));
        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);

        var delete = await alice.DeleteAsync($"/api/tasks/{bobsTask.Id}");
        Assert.Equal(HttpStatusCode.NotFound, delete.StatusCode);

        var stillThere = await bob.GetFromJsonAsync<TaskResponse>($"/api/tasks/{bobsTask.Id}");
        Assert.Equal("Bob's untouchable task", stillThere!.Title);
        Assert.Null(stillThere.CompletedAt);
    }

    [Fact]
    public async Task Listing_tasks_returns_only_the_callers_own()
    {
        var (alice, _) = await factory.SignUpAsync();
        var (bob, _) = await factory.SignUpAsync();

        await CreateTaskAsync(alice, "Alice's task");
        var bobsTask = await CreateTaskAsync(bob, "Bob's task");

        var alices = (await alice.GetFromJsonAsync<List<TaskResponse>>("/api/tasks"))!;

        Assert.Equal(["Alice's task"], alices.Select(t => t.Title));
        Assert.DoesNotContain(alices, t => t.Id == bobsTask.Id);
    }

    [Fact]
    public async Task Creating_a_task_ignores_any_owner_in_the_body()
    {
        var (alice, aliceUser) = await factory.SignUpAsync();
        var (bob, bobUser) = await factory.SignUpAsync();

        // CreateTaskRequest has no owner field, so this is the shape a caller
        // would have to invent to try to plant a task on someone else.
        var response = await alice.PostAsJsonAsync("/api/tasks", new
        {
            title = "Planted on Bob",
            priority = 1,
            ownerId = bobUser.Id,
            owner_id = bobUser.Id,
        });
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<TaskResponse>();

        var bobs = await bob.GetFromJsonAsync<List<TaskResponse>>("/api/tasks");
        Assert.DoesNotContain(bobs!, t => t.Id == created!.Id);

        var alices = await alice.GetFromJsonAsync<List<TaskResponse>>("/api/tasks");
        Assert.Contains(alices!, t => t.Id == created!.Id);
        Assert.NotEqual(aliceUser.Id, bobUser.Id);
    }

    [Fact]
    public async Task Tasks_require_authentication()
    {
        var anonymous = factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/tasks")).StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await anonymous.GetAsync($"/api/tasks/{Guid.NewGuid()}")).StatusCode);
    }

    private static async Task<TaskResponse> CreateTaskAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            Title: title, Description: null, Priority: TaskPriority.Medium, DueAt: null));

        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TaskResponse>())!;
    }
}
