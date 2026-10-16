using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Enjazi.Api.Auth;

/// <summary>
/// The two rate limits (ADR-0017). Guest creation is counted per client
/// address, because it is anonymous and each call creates rows; Program.cs
/// makes RemoteIpAddress the client's through the forwarded headers. Room
/// messages are counted per user, guests and accounts alike.
/// </summary>
public static class RateLimits
{
    public const string GuestCreation = "guest-creation";
    public const string Messages = "messages";

    public const int MessagesPerMinute = 30;

    public static void Configure(RateLimiterOptions options, IConfiguration configuration)
    {
        var guestsPerHour = configuration.GetValue("Guest:PermitsPerHour", 5);

        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = (context, _) =>
        {
            if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            {
                context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
            }

            return ValueTask.CompletedTask;
        };

        options.AddPolicy(GuestCreation, context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = guestsPerHour, Window = TimeSpan.FromHours(1) }));

        options.AddPolicy(Messages, context => RateLimitPartition.GetFixedWindowLimiter(
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = MessagesPerMinute, Window = TimeSpan.FromMinutes(1) }));
    }
}
