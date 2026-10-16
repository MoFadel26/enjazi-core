using Enjazi.Api.Contracts;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Sign-up, sign-in and sign-out happen in Clerk, in the browser. What is left
/// here is the local view of the caller: the id and roles the API uses.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController(UserManager<User> userManager) : ControllerBase
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

    private async Task<UserResponse> ToResponseAsync(User user) => new(
        user.Id,
        user.Email!,
        user.DisplayName,
        (IReadOnlyList<string>)await userManager.GetRolesAsync(user));
}
