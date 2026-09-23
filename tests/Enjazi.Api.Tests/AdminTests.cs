using System.Net;
using System.Net.Http.Json;
using Enjazi.Api.Auth;
using Enjazi.Api.Contracts;
using Microsoft.Extensions.DependencyInjection;

namespace Enjazi.Api.Tests;

[Collection(nameof(ApiCollection))]
public sealed class AdminTests(ApiFactory factory)
{
    [Fact]
    public async Task A_signed_in_non_admin_gets_403()
    {
        var (client, user) = await factory.SignUpAsync();

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/admin/users/{user.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PutAsJsonAsync($"/api/admin/users/{user.Id}",
            new AdminUpdateUserRequest(false, []))).StatusCode);
    }

    [Fact]
    public async Task Anonymous_gets_401_not_403()
    {
        var anonymous = factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/admin/users")).StatusCode);
    }

    [Fact]
    public async Task Bootstrap_promotes_an_existing_account_and_the_cookie_carries_the_role()
    {
        var (admin, _) = await factory.SignUpAdminAsync();

        var me = await admin.GetFromJsonAsync<UserResponse>("/api/auth/me");

        Assert.Equal([Roles.Admin], me!.Roles);
    }

    [Fact]
    public async Task Bootstrap_with_an_unknown_address_does_nothing()
    {
        using var scope = factory.Services.CreateScope();

        Assert.False(await AdminBootstrap.PromoteAsync(scope.ServiceProvider, "nobody@example.test"));
    }

    [Fact]
    public async Task List_searches_across_all_users_and_pages()
    {
        var (admin, _) = await factory.SignUpAdminAsync();
        var (_, needle) = await factory.SignUpAsync();

        var search = Uri.EscapeDataString(needle.Email);
        var page = await admin.GetFromJsonAsync<PagedResponse<AdminUserResponse>>(
            $"/api/admin/users?search={search}&page=1&pageSize=5");

        var found = Assert.Single(page!.Items);
        Assert.Equal(needle.Id, found.Id);
        Assert.Equal(1, page.Total);
        Assert.Equal(5, page.PageSize);
    }

    [Fact]
    public async Task Disabling_a_user_blocks_their_next_login()
    {
        var (admin, _) = await factory.SignUpAdminAsync();
        var (_, victim) = await factory.SignUpAsync();

        var update = await admin.PutAsJsonAsync($"/api/admin/users/{victim.Id}",
            new AdminUpdateUserRequest(Disabled: true, Roles: []));
        update.EnsureSuccessStatusCode();
        Assert.True((await update.Content.ReadFromJsonAsync<AdminUserResponse>())!.Disabled);

        var login = await factory.CreateHttpsClient().PostAsJsonAsync(
            "/api/auth/login", new LoginRequest(victim.Email, SignedInClient.Password));
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);

        var reenable = await admin.PutAsJsonAsync($"/api/admin/users/{victim.Id}",
            new AdminUpdateUserRequest(Disabled: false, Roles: []));
        reenable.EnsureSuccessStatusCode();

        var loginAgain = await factory.CreateHttpsClient().PostAsJsonAsync(
            "/api/auth/login", new LoginRequest(victim.Email, SignedInClient.Password));
        Assert.Equal(HttpStatusCode.OK, loginAgain.StatusCode);
    }

    [Fact]
    public async Task Roles_can_be_granted_and_revoked()
    {
        var (admin, _) = await factory.SignUpAdminAsync();
        var (_, other) = await factory.SignUpAsync();

        var grant = await admin.PutAsJsonAsync($"/api/admin/users/{other.Id}",
            new AdminUpdateUserRequest(false, [Roles.Admin]));
        Assert.Equal([Roles.Admin], (await grant.Content.ReadFromJsonAsync<AdminUserResponse>())!.Roles);

        var revoke = await admin.PutAsJsonAsync($"/api/admin/users/{other.Id}",
            new AdminUpdateUserRequest(false, []));
        Assert.Empty((await revoke.Content.ReadFromJsonAsync<AdminUserResponse>())!.Roles);

        var unknown = await admin.PutAsJsonAsync($"/api/admin/users/{other.Id}",
            new AdminUpdateUserRequest(false, ["Overlord"]));
        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
    }

    [Fact]
    public async Task An_admin_cannot_change_their_own_account()
    {
        var (admin, me) = await factory.SignUpAdminAsync();

        var response = await admin.PutAsJsonAsync($"/api/admin/users/{me.Id}",
            new AdminUpdateUserRequest(Disabled: true, Roles: []));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_returns_404_for_an_unknown_id()
    {
        var (admin, _) = await factory.SignUpAdminAsync();

        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/admin/users/{Guid.NewGuid()}")).StatusCode);
    }
}
