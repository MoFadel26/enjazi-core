using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Sign-up, sign-in and sign-out happen in Clerk, in the browser. What is left
/// here is the local view of the caller, the id and roles the API uses, and
/// guest sessions, which this API issues itself (ADR-0017).
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    UserManager<User> userManager,
    AppDbContext db,
    GuestTokens guestTokens,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var user = await userManager.GetUserAsync(User);
        return user is null ? Unauthorized() : Ok(await ToResponseAsync(user));
    }

    /// <summary>
    /// Deletes the caller's account and its Clerk user (ADR-0019). Nothing is
    /// deleted unless Clerk deletes its user too, and the only admin is refused.
    /// </summary>
    [HttpDelete("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> DeleteMe([FromServices] AccountDeletion deletion, CancellationToken cancellationToken)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return await deletion.DeleteAsync(user.Id, cancellationToken) switch
            {
                AccountDeletionResult.Unavailable => Problem(
                    title: "Account deletion is not available.",
                    statusCode: StatusCodes.Status503ServiceUnavailable),
                AccountDeletionResult.LastAdmin => Problem(
                    title: "You are the only admin. Make someone else an admin in Users, then delete your account.",
                    statusCode: StatusCodes.Status409Conflict),
                _ => NoContent(),
            };
        }
        catch (HttpRequestException e)
        {
            logger.LogError(e, "Clerk refused to delete the user behind {UserId}", user.Id);
            return Problem(
                title: "Your sign-in could not be deleted. Nothing was deleted; try again.",
                statusCode: StatusCodes.Status502BadGateway);
        }
    }

    /// <summary>
    /// Creates a guest with sample data and returns its first token. Limited
    /// per client address, because each call creates rows.
    /// </summary>
    [HttpPost("guest")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.GuestCreation)]
    [ProducesResponseType<GuestSessionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> StartGuest(StartGuestRequest request, [FromServices] GuestAccounts guests)
    {
        if (!guestTokens.Enabled)
        {
            return Problem(title: "Guest mode is not available.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var guest = await guests.CreateAsync(request.TimeZone, request.Theme);

        // The address the rate limit counted, after the forwarded headers.
        // Logged so the ingress setup can be checked against a real request.
        logger.LogInformation("Created guest {GuestId} for {RemoteIp}", guest.Id, HttpContext.Connection.RemoteIpAddress);

        return Ok(new GuestSessionResponse(guestTokens.Create(guest, DateTimeOffset.UtcNow), guest.ExpiresAt!.Value));
    }

    /// <summary>
    /// A new token for a guest that still exists. The old token may have
    /// expired, so a tab that slept past it keeps its session; the guest's own
    /// expiry is the limit.
    /// </summary>
    [HttpPost("guest/refresh")]
    [AllowAnonymous]
    [ProducesResponseType<GuestSessionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshGuest(RefreshGuestRequest request)
    {
        var id = await guestTokens.ReadGuestIdAsync(request.Token);
        var now = DateTimeOffset.UtcNow;
        var guest = id is null ? null : await db.Users.SingleOrDefaultAsync(u => u.Id == id && u.IsGuest && u.ExpiresAt > now);
        return guest is null
            ? Unauthorized()
            : Ok(new GuestSessionResponse(guestTokens.Create(guest, now), guest.ExpiresAt!.Value));
    }

    private async Task<UserResponse> ToResponseAsync(User user) => new(
        user.Id,
        user.Email!,
        user.DisplayName,
        (IReadOnlyList<string>)await userManager.GetRolesAsync(user),
        user.IsGuest,
        user.ExpiresAt);
}
