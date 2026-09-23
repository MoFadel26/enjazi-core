using Enjazi.Api.Contracts;
using Enjazi.Api.Streaks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Enjazi.Api.Controllers;

/// <summary>
/// Read-only. The streak changes when a task is completed, through
/// <see cref="TasksController"/>; there is no way to set it directly.
/// </summary>
[ApiController]
[Route("api/streak")]
[Authorize]
public sealed class StreakController(StreakService streaks) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<StreakResponse>(StatusCodes.Status200OK)]
    public Task<StreakResponse> Get() => streaks.ReadAsync();
}
