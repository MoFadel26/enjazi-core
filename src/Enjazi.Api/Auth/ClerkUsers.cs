using System.Net;
using System.Net.Http.Headers;

namespace Enjazi.Api.Auth;

/// <summary>The one Clerk Backend API call the API makes (ADR-0019).</summary>
public interface IClerkUsers
{
    /// <summary>False when Clerk:SecretKey is not set.</summary>
    bool Enabled { get; }

    /// <summary>
    /// Deletes the Clerk user, which also ends their sessions. A user Clerk no
    /// longer has counts as deleted. Throws when Clerk refuses or is down.
    /// </summary>
    Task DeleteAsync(string clerkUserId, CancellationToken cancellationToken);
}

/// <summary>
/// DELETE https://api.clerk.com/v1/users/{id}, signed with Clerk:SecretKey.
/// The secret stays in the API; the browser never holds it.
/// </summary>
public sealed class ClerkUsers(HttpClient http, IConfiguration configuration) : IClerkUsers
{
    public static readonly Uri BaseAddress = new("https://api.clerk.com/v1/");

    private string? SecretKey => configuration["Clerk:SecretKey"];

    public bool Enabled => !string.IsNullOrEmpty(SecretKey);

    public async Task DeleteAsync(string clerkUserId, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"users/{Uri.EscapeDataString(clerkUserId)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", SecretKey);
        using var response = await http.SendAsync(request, cancellationToken);
        if (response.StatusCode != HttpStatusCode.NotFound)
        {
            response.EnsureSuccessStatusCode();
        }
    }
}
