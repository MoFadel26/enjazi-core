using System.ComponentModel.DataAnnotations;

namespace Enjazi.Api.Contracts;

/// <summary>
/// As with tasks, no owner field: the owner comes from the cookie.
/// </summary>
public sealed record CreateEventRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool AllDay);

public sealed record UpdateEventRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool AllDay);

public sealed record EventResponse(
    Guid Id,
    string Title,
    string? Description,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool AllDay,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
