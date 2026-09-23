using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Enjazi.Api.Hubs;

/// <summary>
/// Deliberately empty. Clients connect and listen; they never call in.
/// Messages are sent over REST, and <see cref="Controllers.MessagesController"/>
/// pushes each one to the users who are members of the room at that moment,
/// by user id. There are no SignalR groups to join, so there is no group
/// membership that could drift from the room_members table: someone removed
/// from a room stops receiving with the next message, with no reconnect.
/// The client message is "MessageReceived" carrying a MessageResponse.
/// </summary>
[Authorize]
public sealed class RoomHub : Hub;
