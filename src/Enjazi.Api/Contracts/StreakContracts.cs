namespace Enjazi.Api.Contracts;

/// <summary>
/// CurrentLength is the streak as of today: zero once a day has been missed,
/// even though the row still holds the old run until the next completion
/// overwrites it. LastCompletedOn is a calendar day in the user's time zone.
/// </summary>
public sealed record StreakResponse(
    int CurrentLength,
    int LongestLength,
    int Points,
    DateOnly? LastCompletedOn,
    bool CompletedToday);
