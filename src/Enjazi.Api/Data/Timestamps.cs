namespace Enjazi.Api.Data;

/// <summary>
/// The current time at the precision Postgres stores. timestamptz keeps
/// microseconds and .NET ticks are 100ns, so an untruncated value returned
/// from a create or update differs from what a later read returns. Linux
/// clocks fill the last digit; macOS clocks leave it zero, which hides this
/// locally.
/// </summary>
public static class Timestamps
{
    public static DateTimeOffset UtcNow()
    {
        var now = DateTimeOffset.UtcNow;
        return now.AddTicks(-(now.Ticks % TimeSpan.TicksPerMicrosecond));
    }
}
