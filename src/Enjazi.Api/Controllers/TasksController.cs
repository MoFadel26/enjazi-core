using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Nothing here checks ownership. Reads are already restricted to the caller
/// by the global query filter in <see cref="AppDbContext"/>, so a task
/// belonging to someone else is simply not found.
/// </summary>
[ApiController]
[Route("api/tasks")]
[Authorize]
public sealed class TasksController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TaskResponse>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<TaskResponse>> List() =>
        // Projected inline rather than through ToResponse: EF Core has to
        // translate this to SQL, and it cannot translate a method call.
        // Postgres sorts nulls last on an ascending column, so undated tasks
        // come after dated ones.
        await db.Tasks
            .OrderBy(t => t.DueAt)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TaskResponse(
                t.Id, t.Title, t.Description, t.Priority, t.DueAt,
                t.CompletedAt, t.CreatedAt, t.UpdatedAt))
            .ToListAsync();

    [HttpGet("{id:guid}")]
    [ProducesResponseType<TaskResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponse>> Get(Guid id)
    {
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        return task is null ? NotFound() : ToResponse(task);
    }

    [HttpPost]
    [ProducesResponseType<TaskResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<TaskResponse>> Create(CreateTaskRequest request)
    {
        var now = DateTimeOffset.UtcNow;
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            OwnerId = currentUser.Id,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            // Npgsql refuses to write a DateTimeOffset with a non-zero offset
            // to timestamptz, and a client in any other timezone sends one.
            DueAt = request.DueAt?.ToUniversalTime(),
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = task.Id }, ToResponse(task));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<TaskResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponse>> Update(Guid id, UpdateTaskRequest request)
    {
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Priority = request.Priority;
        task.DueAt = request.DueAt?.ToUniversalTime();
        task.CompletedAt = request.Completed
            ? task.CompletedAt ?? DateTimeOffset.UtcNow
            : null;
        task.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(task);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static TaskResponse ToResponse(TaskItem t) => new(
        t.Id, t.Title, t.Description, t.Priority, t.DueAt,
        t.CompletedAt, t.CreatedAt, t.UpdatedAt);
}
