using System.ComponentModel.DataAnnotations;
using Enjazi.Api.Data.Entities;

namespace Enjazi.Api.Contracts;

public sealed record CreateRoomRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(1000)] string? Description);

public sealed record UpdateRoomRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(1000)] string? Description);

/// <summary>
/// Visible to every signed-in user, so it carries nothing private: a name, a
/// description, how many people are in it, and whether the caller is one.
/// </summary>
public sealed record RoomResponse(
    Guid Id,
    string Name,
    string? Description,
    Guid OwnerId,
    DateTimeOffset CreatedAt,
    int MemberCount,
    bool IsMember);

public sealed record RoomMemberResponse(
    Guid UserId,
    string DisplayName,
    RoomRole Role,
    DateTimeOffset JoinedAt);
