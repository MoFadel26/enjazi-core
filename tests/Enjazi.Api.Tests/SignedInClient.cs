using System.Net.Http.Json;
using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Microsoft.Extensions.DependencyInjection;

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
            Password: Password));

        response.EnsureSuccessStatusCode();
        var user = await response.Content.ReadFromJsonAsync<UserResponse>();
        return (client, user!);
    }

    /// <summary>
    /// Registers a user and makes them an admin through the same code path
    /// production uses for the first admin. The role claim is read from the
    /// cookie, so the client logs in again to get a cookie that carries it.
    /// </summary>
    public static async Task<(HttpClient Client, UserResponse User)> SignUpAdminAsync(this ApiFactory factory)
    {
        var (client, user) = await factory.SignUpAsync();

        using var scope = factory.Services.CreateScope();
        Assert.True(await AdminBootstrap.PromoteAsync(scope.ServiceProvider, user.Email));

        var login = await client.PostAsJsonAsync(
            "/api/auth/login", new LoginRequest(user.Email, Password));
        login.EnsureSuccessStatusCode();

        return (client, user);
    }

    public const string Password = "correct-horse-battery-staple";
}
