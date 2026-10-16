using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class AuthTests(ApiFactory factory)
{
    [Fact]
    public async Task The_first_request_creates_the_local_user_and_later_ones_reuse_it()
    {
        var email = $"first-{Guid.NewGuid():n}@example.test";
        var client = ClientWith(TestTokens.Create(TestTokens.NewClerkUserId(), email, name: "Ada Lovelace"));

        var first = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");
        var second = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");

        Assert.Equal(first!.Id, second!.Id);
        Assert.Equal(email, first.Email);
        Assert.Equal("Ada Lovelace", first.DisplayName);
        Assert.Empty(first.Roles);
    }

    [Fact]
    public async Task Concurrent_first_requests_create_one_user()
    {
        var client = ClientWith(TestTokens.Create(TestTokens.NewClerkUserId(), $"race-{Guid.NewGuid():n}@example.test"));

        var users = await Task.WhenAll(Enumerable.Range(0, 8)
            .Select(_ => client.GetFromJsonAsync<UserResponse>("/api/auth/me")));

        Assert.Single(users.Select(u => u!.Id).Distinct());
    }

    [Fact]
    public async Task A_missing_name_falls_back_to_the_email_local_part()
    {
        var client = ClientWith(TestTokens.Create(TestTokens.NewClerkUserId(), "no.name@example.test", name: null));

        var me = await client.GetFromJsonAsync<UserResponse>("/api/auth/me");

        Assert.Equal("no.name", me!.DisplayName);
    }

    [Fact]
    public async Task No_token_is_401()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task A_token_without_an_email_claim_is_401()
    {
        var client = ClientWith(TestTokens.Create(TestTokens.NewClerkUserId(), email: null));

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task A_token_issued_to_another_origin_is_401()
    {
        var client = ClientWith(TestTokens.Create(
            TestTokens.NewClerkUserId(), $"azp-{Guid.NewGuid():n}@example.test", azp: "https://elsewhere.example.test"));

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task A_token_signed_with_another_key_is_401()
    {
        var client = ClientWith(TestTokens.Create(
            TestTokens.NewClerkUserId(), $"forged-{Guid.NewGuid():n}@example.test",
            key: new SymmetricSecurityKey(new byte[32])));

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task An_address_taken_by_another_clerk_user_is_401()
    {
        var (_, existing) = await factory.SignUpAsync();
        var client = ClientWith(TestTokens.Create(TestTokens.NewClerkUserId(), existing.Email));

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task The_bootstrap_address_is_an_admin_from_its_first_request()
    {
        var email = $"boot-{Guid.NewGuid():n}@example.test";
        using var configured = factory.WithWebHostBuilder(b => b.UseSetting("Bootstrap:AdminEmail", email));

        var (_, user) = await configured.SignUpAsync(email);

        Assert.Equal([Roles.Admin], user.Roles);
    }

    [Fact]
    public async Task The_hub_accepts_the_token_in_the_query_string()
    {
        var token = TestTokens.Create(TestTokens.NewClerkUserId(), $"hub-{Guid.NewGuid():n}@example.test");
        var client = factory.CreateHttpsClient();

        var withToken = await client.PostAsync(
            $"/hubs/rooms/negotiate?negotiateVersion=1&access_token={token}", content: null);
        var without = await client.PostAsync("/hubs/rooms/negotiate?negotiateVersion=1", content: null);

        Assert.Equal(HttpStatusCode.OK, withToken.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, without.StatusCode);
    }

    [Fact]
    public async Task The_api_ignores_a_token_in_the_query_string()
    {
        var token = TestTokens.Create(TestTokens.NewClerkUserId(), $"query-{Guid.NewGuid():n}@example.test");

        var response = await factory.CreateHttpsClient().GetAsync($"/api/auth/me?access_token={token}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private HttpClient ClientWith(string token)
    {
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
