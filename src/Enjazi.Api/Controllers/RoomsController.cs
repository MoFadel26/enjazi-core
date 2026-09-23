using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Rooms are shared, so unlike tasks and events they carry no query filter:
/// every signed-in user can see that a room exists in order to join it.
/// Membership gates the contents, and room administration is gated by a
/// RoomRole.Admin membership rather than by the owner column. ADR-0007
/// explains why this one area is an explicit check rather than a filter.
/// </summary>
[ApiController]
[Route("api/rooms")]
[Authorize]
public sealed class RoomsController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<RoomResponse>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<RoomResponse>> List()
    {
        var me = currentUser.Id;
        return await db.Rooms
            .OrderBy(r => r.Name)
            .Select(r => new RoomResponse(
                r.Id, r.Name, r.Description, r.OwnerId, r.CreatedAt,
                r.Members.Count, r.Members.Any(m => m.UserId == me)))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<RoomResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoomResponse>> Get(Guid id)
    {
        var me = currentUser.Id;
        var room = await db.Rooms
            .Where(r => r.Id == id)
            .Select(r => new RoomResponse(
                r.Id, r.Name, r.Description, r.OwnerId, r.CreatedAt,
                r.Members.Count, r.Members.Any(m => m.UserId == me)))
            .FirstOrDefaultAsync();

        return room is null ? NotFound() : room;
    }

    [HttpPost]
    [ProducesResponseType<RoomResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<RoomResponse>> Create(CreateRoomRequest request)
    {
        var now = DateTimeOffset.UtcNow;
        var room = new Room
        {
            Id = Guid.NewGuid(),
            OwnerId = currentUser.Id,
            Name = request.Name,
            Description = request.Description,
            CreatedAt = now,
        };

        // The creator is a member from the start, and an admin of it. Room
        // administration reads this row, not rooms.owner_id, so that it can
        // later be granted to someone else without changing who created it.
        room.Members.Add(new RoomMember
        {
            RoomId = room.Id,
            UserId = currentUser.Id,
            Role = RoomRole.Admin,
            JoinedAt = now,
        });

        db.Rooms.Add(room);
        await db.SaveChangesAsync();

        var response = new RoomResponse(
            room.Id, room.Name, room.Description, room.OwnerId, room.CreatedAt,
            MemberCount: 1, IsMember: true);

        return CreatedAtAction(nameof(Get), new { id = room.Id }, response);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<RoomResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoomResponse>> Update(Guid id, UpdateRoomRequest request)
    {
        var room = await AdministeredRoomAsync(id);
        if (room is null)
        {
            return NotFound();
        }

        room.Name = request.Name;
        room.Description = request.Description;
        await db.SaveChangesAsync();

        return new RoomResponse(
            room.Id, room.Name, room.Description, room.OwnerId, room.CreatedAt,
            await db.RoomMembers.CountAsync(m => m.RoomId == id), IsMember: true);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var room = await AdministeredRoomAsync(id);
        if (room is null)
        {
            return NotFound();
        }

        // Members and messages go with it, by the cascade in ADR-0005.
        db.Rooms.Remove(room);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/members")]
    [ProducesResponseType<IReadOnlyList<RoomMemberResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<RoomMemberResponse>>> Members(Guid id)
    {
        if (!await IsMemberAsync(id))
        {
            // 404 rather than 403, for the same reason as everywhere else: a
            // 403 would confirm what the room contains to someone outside it.
            return NotFound();
        }

        return await db.RoomMembers
            .Where(m => m.RoomId == id)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new RoomMemberResponse(
                m.UserId, m.User.DisplayName, m.Role, m.JoinedAt))
            .ToListAsync<RoomMemberResponse>();
    }

    /// <summary>Join. Idempotent, so a second call is not an error.</summary>
    [HttpPost("{id:guid}/members")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Join(Guid id)
    {
        if (!await db.Rooms.AnyAsync(r => r.Id == id))
        {
            return NotFound();
        }

        if (await IsMemberAsync(id))
        {
            return NoContent();
        }

        db.RoomMembers.Add(new RoomMember
        {
            RoomId = id,
            UserId = currentUser.Id,
            Role = RoomRole.Member,
            JoinedAt = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Leave, or remove someone else if the caller runs the room.</summary>
    [HttpDelete("{id:guid}/members/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var leaving = userId == currentUser.Id;
        if (!leaving && await AdministeredRoomAsync(id) is null)
        {
            return NotFound();
        }

        var member = await db.RoomMembers
            .Include(m => m.Room)
            .FirstOrDefaultAsync(m => m.RoomId == id && m.UserId == userId);

        if (member is null)
        {
            return NotFound();
        }

        if (member.Room.OwnerId == userId)
        {
            ModelState.AddModelError(
                nameof(userId),
                "The room's creator cannot be removed from it. Delete the room instead.");
            return ValidationProblem(ModelState);
        }

        db.RoomMembers.Remove(member);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<bool> IsMemberAsync(Guid roomId) =>
        db.RoomMembers.AnyAsync(m => m.RoomId == roomId && m.UserId == currentUser.Id);

    /// <summary>
    /// The room, but only if the caller administers it. Null otherwise, so
    /// every caller of this turns that into a 404 rather than a 403.
    /// </summary>
    private Task<Room?> AdministeredRoomAsync(Guid roomId) =>
        db.Rooms.FirstOrDefaultAsync(r =>
            r.Id == roomId &&
            r.Members.Any(m => m.UserId == currentUser.Id && m.Role == RoomRole.Admin));
}
