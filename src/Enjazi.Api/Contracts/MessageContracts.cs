using System.ComponentModel.DataAnnotations;

namespace Enjazi.Api.Contracts;

public sealed record SendMessageRequest([Required, MaxLength(4000)] string Body);

public sealed record MessageResponse(
    Guid Id,
    Guid RoomId,
    Guid AuthorId,
    string AuthorName,
    string Body,
    DateTimeOffset CreatedAt);
