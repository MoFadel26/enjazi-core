using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers.Admin;

/// <summary>
/// The one place that reads across users. Nothing here goes through a
/// user-scoped DbSet, so there is no IgnoreQueryFilters() call to audit;
/// the users table has no filter because it is not user-scoped data.
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = Policies.Admin)]
public sealed class UsersController(
    AppDbContext db,
    UserManager<User> userManager,
    RoleManager<Role> roleManager,
    ICurrentUser currentUser) : ControllerBase
{
    private const int MaxPageSize = 100;

    [HttpGet]
    [ProducesResponseType<PagedResponse<AdminUserResponse>>(StatusCodes.Status200OK)]
    public async Task<PagedResponse<AdminUserResponse>> List(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Email!, pattern) ||
                EF.Functions.ILike(u.DisplayName, pattern));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<AdminUserResponse>(users.Count);
        foreach (var user in users)
        {
            items.Add(await ToResponseAsync(user));
        }

        return new PagedResponse<AdminUserResponse>(items, page, pageSize, total);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AdminUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserResponse>> Get(Guid id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        return user is null ? NotFound() : await ToResponseAsync(user);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AdminUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserResponse>> Update(Guid id, AdminUpdateUserRequest request)
    {
        if (id == currentUser.Id)
        {
            // Disabling yourself or dropping your own Admin role locks the
            // last admin out with no way back. Another admin has to do it.
            ModelState.AddModelError(nameof(id), "An admin cannot change their own account.");
            return ValidationProblem(ModelState);
        }

        foreach (var role in request.Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                ModelState.AddModelError(nameof(request.Roles), $"Unknown role '{role}'.");
            }
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        // Lockout is Identity's own mechanism, so PasswordSignInAsync refuses
        // the account without any code of ours in the login path. A live
        // cookie stays valid until it expires; ADR-0006 notes the trade.
        user.LockoutEnabled = true;
        user.LockoutEnd = request.Disabled ? DateTimeOffset.MaxValue : null;
        await userManager.UpdateAsync(user);

        var current = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, current.Except(request.Roles));
        await userManager.AddToRolesAsync(user, request.Roles.Except(current));

        return await ToResponseAsync(user);
    }

    private async Task<AdminUserResponse> ToResponseAsync(User user) => new(
        user.Id,
        user.Email!,
        user.DisplayName,
        (IReadOnlyList<string>)await userManager.GetRolesAsync(user),
        Disabled: user.LockoutEnd is { } end && end > DateTimeOffset.UtcNow,
        user.CreatedAt);
}
