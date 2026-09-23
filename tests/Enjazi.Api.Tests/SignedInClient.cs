using System.Net.Http.Json;
using Enjazi.Api.Contracts;

namespace Enjazi.Api.Tests;

public static class SignedInClient
{
    /// <summary>
    /// Registers a new user and returns a client holding their auth cookie.
    /// Each call gets a fresh address because the database outlives one test.
    /// </summary>
    public static async Task<(HttpClient Client, UserResponse User)> SignUpAsync(this ApiFactory factory)
    {
        var client = factory.CreateHttpsClient();
        var email = $"user-{Guid.NewGuid():n}@example.test";

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: email,
            DisplayName: "Test User",
            Password: "correct-horse-battery-staple"));

        response.EnsureSuccessStatusCode();
        var user = await response.Content.ReadFromJsonAsync<UserResponse>();
        return (client, user!);
    }
}
