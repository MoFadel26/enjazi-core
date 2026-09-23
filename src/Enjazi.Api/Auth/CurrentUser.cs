using System.Security.Claims;

namespace Enjazi.Api.Auth;

/// <summary>
/// The caller's id, as the data layer sees it. Exists so that
/// <see cref="Data.AppDbContext"/> can read it without depending on
/// HTTP types, and so tests can substitute a caller.
/// </summary>
public interface ICurrentUser
{
    /// <summary>
    /// <see cref="Guid.Empty"/> when the request is unauthenticated. That
    /// value matches no row, so an unauthenticated context sees nothing
    /// rather than everything.
    /// </summary>
    Guid Id { get; }
}

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid Id =>
        Guid.TryParse(
            accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier),
            out var id)
            ? id
            : Guid.Empty;
}
