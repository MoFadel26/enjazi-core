using System.ComponentModel.DataAnnotations;

namespace Enjazi.Api.Contracts;

/// <summary>
/// ExpiresAt is set for guests only: when the account and its data are
/// deleted (ADR-0017).
/// </summary>
public sealed record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles,
    bool IsGuest,
    DateTimeOffset? ExpiresAt);

/// <summary>The browser's IANA time zone, so the sample's "today" is the guest's.</summary>
public sealed record StartGuestRequest([MaxLength(100)] string? TimeZone);

public sealed record RefreshGuestRequest([Required] string Token);

/// <summary>A bearer token for the guest, and when the guest itself expires.</summary>
public sealed record GuestSessionResponse(string Token, DateTimeOffset ExpiresAt);
