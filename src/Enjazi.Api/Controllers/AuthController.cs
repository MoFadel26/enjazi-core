using Enjazi.Api.Contracts;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Enjazi.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    UserManager<User> userManager,
    SignInManager<User> signInManager) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<UserResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return ValidationProblem(ToModelState(result));
        }

        await signInManager.SignInAsync(user, isPersistent: true);
        return CreatedAtAction(nameof(Me), await ToResponseAsync(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            // Same response as a wrong password, so the endpoint cannot be
            // used to find out which addresses have accounts.
            return Unauthorized();
        }

        var result = await signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: true, lockoutOnFailure: true);

        return result.Succeeded ? Ok(await ToResponseAsync(user)) : Unauthorized();
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        // Not SignInManager.SignOutAsync: that also signs out of the external
        // and two-factor schemes, which this application does not register.
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        return NoContent();
    }

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

    private static ModelStateDictionary ToModelState(IdentityResult result)
    {
        var state = new ModelStateDictionary();
        foreach (var error in result.Errors)
        {
            state.AddModelError(error.Code, error.Description);
        }

        return state;
    }
}
