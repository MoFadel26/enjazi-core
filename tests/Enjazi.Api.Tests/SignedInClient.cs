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
    /// A client carrying a new guest's token. Each call comes from its own
    /// made-up address unless one is given, because guest creation is limited
    /// per address and the database outlives one test.
    /// </summary>
    public static async Task<(HttpClient Client, GuestSessionResponse Session, UserResponse User)> StartGuestAsync(
        this WebApplicationFactory<Program> factory, string? address = null)
    {
        var response = await factory.PostGuestAsync(address ?? NewAddress());
        response.EnsureSuccessStatusCode();
        var session = (await response.Content.ReadFromJsonAsync<GuestSessionResponse>())!;

        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.Token);
        var user = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");
        return (client, session, user!);
    }

    /// <summary>
    /// POST /api/auth/guest as if from that address: the forwarded header the
    /// ingress would add, which Program.cs turns into RemoteIpAddress.
    /// </summary>
    public static Task<HttpResponseMessage> PostGuestAsync(
        this WebApplicationFactory<Program> factory, string address, string? timeZone = "UTC")
    {
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Add("X-Forwarded-For", address);
        return client.PostAsJsonAsync("/api/auth/guest", new StartGuestRequest(timeZone));
    }

    public static string NewAddress() =>
        $"10.{Random.Shared.Next(256)}.{Random.Shared.Next(256)}.{Random.Shared.Next(1, 255)}";

    /// <summary>
    /// Production redirects plain HTTP to HTTPS, so the test client starts on
    /// https. TestServer honours the scheme of the base address without doing
    /// real TLS.
    /// </summary>
    public static HttpClient CreateHttpsClient(this WebApplicationFactory<Program> factory) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
}
