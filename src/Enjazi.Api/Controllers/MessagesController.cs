using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Enjazi.Api.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Messages carry a query filter (membership of their room), so a non-member
/// reading them gets an empty list from the filter alone. The explicit
/// membership check on top turns that into 404, so "no messages yet" and
/// "not your room" are not the same answer. Sending is checked the same way.
/// </summary>
[ApiController]
[Route("api/rooms/{roomId:guid}/messages")]
[Authorize]
public sealed class MessagesController(
    AppDbContext db,
    ICurrentUser currentUser,
    IHubContext<RoomHub> hub) : ControllerBase
{
    /// <summary>The most recent page, in chronological order.</summary>
    private const int PageSize = 50;

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<MessageResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<MessageResponse>>> List(Guid roomId)
    {
        if (!await IsMemberAsync(roomId))
        {
            return NotFound();
        }

        var latest = await db.Messages
            .Where(m => m.RoomId == roomId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(PageSize)
            .Select(m => new MessageResponse(
                m.Id, m.RoomId, m.AuthorId, m.Author.DisplayName, m.Body, m.CreatedAt))
            .ToListAsync();

        latest.Reverse();
        return latest;
    }

    [HttpPost]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageResponse>> Send(Guid roomId, SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
        {
            ModelState.AddModelError(nameof(request.Body), "A message cannot be blank.");
            return ValidationProblem(ModelState);
        }

        if (!await IsMemberAsync(roomId))
        {
            return NotFound();
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            AuthorId = currentUser.Id,
            Body = request.Body.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync();

        var authorName = await db.Users
            .Where(u => u.Id == currentUser.Id)
            .Select(u => u.DisplayName)
            .SingleAsync();
        var response = new MessageResponse(
            message.Id, message.RoomId, message.AuthorId, authorName, message.Body, message.CreatedAt);

        // Pushed to whoever is a member right now, by user id, so every tab
        // they have open receives it. The sender is a member too and gets
        // their own message back the same way as everyone else's.
        var members = await db.RoomMembers
            .Where(m => m.RoomId == roomId)
            .Select(m => m.UserId.ToString())
            .ToListAsync();
        await hub.Clients.Users(members).SendAsync("MessageReceived", response);

        return StatusCode(StatusCodes.Status201Created, response);
    }

    private Task<bool> IsMemberAsync(Guid roomId) =>
        db.RoomMembers.AnyAsync(m => m.RoomId == roomId && m.UserId == currentUser.Id);
}
