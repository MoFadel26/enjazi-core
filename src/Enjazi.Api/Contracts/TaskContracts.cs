using System.ComponentModel.DataAnnotations;
using Enjazi.Api.Data.Entities;

namespace Enjazi.Api.Contracts;

/// <summary>
/// No owner field. The owner comes from the cookie, never from the body.
/// </summary>
public sealed record CreateTaskRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    TaskPriority Priority,
    DateTimeOffset? DueAt);

public sealed record UpdateTaskRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    TaskPriority Priority,
    DateTimeOffset? DueAt,
    bool Completed);

public sealed record TaskResponse(
    Guid Id,
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTimeOffset? DueAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
