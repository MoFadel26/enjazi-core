using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Owner-scoped exactly like tasks, and for the same reason: the query filter
/// in <see cref="AppDbContext"/> does the scoping, so nothing here checks it.
/// </summary>
[ApiController]
[Route("api/events")]
[Authorize]
public sealed class EventsController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// A calendar asks for a window, not for everything. Both bounds are
    /// optional so the endpoint is still usable without one.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<EventResponse>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<EventResponse>> List(
        [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to)
    {
        var query = db.Events.AsQueryable();

        // An event overlaps the window when it starts before the window ends
        // and ends after the window starts.
        if (to is not null)
        {
            var upper = to.Value.ToUniversalTime();
            query = query.Where(e => e.StartsAt < upper);
        }

        if (from is not null)
        {
            var lower = from.Value.ToUniversalTime();
            query = query.Where(e => e.EndsAt > lower);
        }

        return await query
            .OrderBy(e => e.StartsAt)
            .Select(e => new EventResponse(
                e.Id, e.Title, e.Description, e.StartsAt, e.EndsAt, e.AllDay,
                e.CreatedAt, e.UpdatedAt))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<EventResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventResponse>> Get(Guid id)
    {
        var calendarEvent = await db.Events.FirstOrDefaultAsync(e => e.Id == id);
        return calendarEvent is null ? NotFound() : ToResponse(calendarEvent);
    }

    [HttpPost]
    [ProducesResponseType<EventResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventResponse>> Create(CreateEventRequest request)
    {
        if (request.EndsAt < request.StartsAt)
        {
            ModelState.AddModelError(nameof(request.EndsAt), "An event cannot end before it starts.");
            return ValidationProblem(ModelState);
        }

        var now = DateTimeOffset.UtcNow;
        var calendarEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            OwnerId = currentUser.Id,
            Title = request.Title,
            Description = request.Description,
            StartsAt = request.StartsAt.ToUniversalTime(),
            EndsAt = request.EndsAt.ToUniversalTime(),
            AllDay = request.AllDay,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Events.Add(calendarEvent);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = calendarEvent.Id }, ToResponse(calendarEvent));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<EventResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventResponse>> Update(Guid id, UpdateEventRequest request)
    {
        if (request.EndsAt < request.StartsAt)
        {
            ModelState.AddModelError(nameof(request.EndsAt), "An event cannot end before it starts.");
            return ValidationProblem(ModelState);
        }

        var calendarEvent = await db.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (calendarEvent is null)
        {
            return NotFound();
        }

        calendarEvent.Title = request.Title;
        calendarEvent.Description = request.Description;
        calendarEvent.StartsAt = request.StartsAt.ToUniversalTime();
        calendarEvent.EndsAt = request.EndsAt.ToUniversalTime();
        calendarEvent.AllDay = request.AllDay;
        calendarEvent.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(calendarEvent);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var calendarEvent = await db.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (calendarEvent is null)
        {
            return NotFound();
        }

        db.Events.Remove(calendarEvent);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static EventResponse ToResponse(CalendarEvent e) => new(
        e.Id, e.Title, e.Description, e.StartsAt, e.EndsAt, e.AllDay,
        e.CreatedAt, e.UpdatedAt);
}
