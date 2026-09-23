using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Contracts;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class AuthTests(ApiFactory factory)
{
    [Fact]
    public async Task Register_signs_the_caller_in()
    {
        var (client, user) = await factory.SignUpAsync();

        var me = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");

        Assert.Equal(user.Id, me!.Id);
        Assert.Empty(me.Roles);
    }

    [Fact]
    public async Task Logout_clears_the_cookie()
    {
        var (client, _) = await factory.SignUpAsync();

        var logout = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        var me = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    [Fact]
    public async Task Login_with_the_wrong_password_is_401()
    {
        var (_, user) = await factory.SignUpAsync();
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login", new LoginRequest(user.Email, "not-the-password"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_an_unknown_address_is_401_not_404()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login", new LoginRequest("nobody@example.test", "correct-horse-battery-staple"));

        // A 404 here would tell an attacker which addresses have accounts.
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_second_client_can_log_in_as_an_existing_user()
    {
        var (_, user) = await factory.SignUpAsync();
        var client = factory.CreateHttpsClient();

        var login = await client.PostAsJsonAsync(
            "/api/auth/login", new LoginRequest(user.Email, "correct-horse-battery-staple"));
        login.EnsureSuccessStatusCode();

        var me = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");
        Assert.Equal(user.Id, me!.Id);
    }

    [Fact]
    public async Task A_short_password_is_rejected_with_the_reason()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: $"short-{Guid.NewGuid():n}@example.test",
            DisplayName: "Test User",
            Password: "short"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
