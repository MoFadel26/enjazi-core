using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Enjazi.Api.Controllers;

/// <summary>
/// One row per user, so there is no id in any of these routes. The query
/// filter means the row read is always the caller's.
/// </summary>
[ApiController]
[Route("api/settings")]
[Authorize]
public sealed class SettingsController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    private static readonly string[] Themes = ["light", "dark", "system"];

    /// <summary>
    /// Settings are created on first read rather than at registration, so an
    /// account that predates a new setting still gets its default.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<SettingsResponse>(StatusCodes.Status200OK)]
    public async Task<SettingsResponse> Get()
    {
        var settings = await db.Settings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new UserSettings
            {
                UserId = currentUser.Id,
                Data = new SettingsData(),
                UpdatedAt = DateTimeOffset.UtcNow,
            };

            db.Settings.Add(settings);
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Two first reads at once, which a page with two consumers of
                // the settings produces: both miss, both insert, one loses on
                // the primary key. The winner's row is the answer for both.
                db.Entry(settings).State = EntityState.Detached;
                settings = await db.Settings.FirstAsync();
            }
        }

        return ToResponse(settings);
    }

    [HttpPut]
    [ProducesResponseType<SettingsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SettingsResponse>> Put(SettingsRequest request)
    {
        if (!Themes.Contains(request.Theme))
        {
            ModelState.AddModelError(
                nameof(request.Theme), $"Theme must be one of: {string.Join(", ", Themes)}.");
        }

        if (!TimeZoneInfo.TryFindSystemTimeZoneById(request.TimeZone, out _))
        {
            ModelState.AddModelError(nameof(request.TimeZone), "Unknown time zone.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var settings = await db.Settings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new UserSettings { UserId = currentUser.Id };
            db.Settings.Add(settings);
        }

        settings.Data = new SettingsData
        {
            Theme = request.Theme,
            TimeZone = request.TimeZone,
            Notifications = new NotificationSettings
            {
                EmailTaskReminders = request.Notifications.EmailTaskReminders,
                BrowserTaskReminders = request.Notifications.BrowserTaskReminders,
                RoomMessages = request.Notifications.RoomMessages,
            },
        };
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(settings);
    }

    private static SettingsResponse ToResponse(UserSettings s) => new(
        s.Data.Theme,
        s.Data.TimeZone,
        new NotificationSettingsContract(
            s.Data.Notifications.EmailTaskReminders,
            s.Data.Notifications.BrowserTaskReminders,
            s.Data.Notifications.RoomMessages),
        s.UpdatedAt);
}
