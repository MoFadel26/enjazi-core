using System.Net.Http.Headers;
using System.Net.Http.Json;
using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Enjazi.Api.Tests;

public static class SignedInClient
{
    /// <summary>
    /// A client carrying a token for a new Clerk user. The first request
    /// creates the local user, as a real first sign-in does. Each call gets a
    /// fresh address because the database outlives one test.
    /// </summary>
    public static async Task<(HttpClient Client, UserResponse User)> SignUpAsync(
        this WebApplicationFactory<Program> factory, string? email = null)
    {
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            TestTokens.Create(TestTokens.NewClerkUserId(), email ?? $"user-{Guid.NewGuid():n}@example.test"));

        var user = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");
        return (client, user!);
    }

    /// <summary>
    /// Signs up a user and makes them an admin through the same code path
    /// production uses for the first admin. Roles are read from the database
    /// on every request, so the same token carries the role at once.
    /// </summary>
    public static async Task<(HttpClient Client, UserResponse User)> SignUpAdminAsync(this ApiFactory factory)
    {
        var (client, user) = await factory.SignUpAsync();

        using var scope = factory.Services.CreateScope();
        Assert.True(await AdminBootstrap.PromoteAsync(scope.ServiceProvider, user.Email));

        return (client, user);
    }

    /// <summary>
    /// Production redirects plain HTTP to HTTPS, so the test client starts on
    /// https. TestServer honours the scheme of the base address without doing
    /// real TLS.
    /// </summary>
    public static HttpClient CreateHttpsClient(this WebApplicationFactory<Program> factory) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
}
