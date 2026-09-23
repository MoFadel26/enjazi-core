using System.ComponentModel.DataAnnotations;

namespace Enjazi.Api.Contracts;

public sealed record AdminUserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles,
    bool Disabled,
    DateTimeOffset CreatedAt);

/// <summary>
/// Everything an admin may change about an account, in one request. Disabling
/// is Identity's lockout with no end date; ADR-0005 says prefer disabling to
/// deleting, so there is no delete.
/// </summary>
public sealed record AdminUpdateUserRequest(
    bool Disabled,
    [Required] IReadOnlyList<string> Roles);

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int Total);
