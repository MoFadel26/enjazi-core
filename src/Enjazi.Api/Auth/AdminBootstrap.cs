using Enjazi.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;

namespace Enjazi.Api.Auth;

public static class Roles
{
    public const string Admin = "Admin";
}

public static class Policies
{
    public const string Admin = "Admin";
}

/// <summary>
/// Makes the first admin. Reads Bootstrap:AdminEmail; if it is set and an
/// account with that address exists, ensures the Admin role exists and that
/// the account holds it. Does nothing at all when the setting is absent, so
/// startup never touches the database in environments that have not asked
/// for an admin, which includes the test host and OpenAPI generation.
/// </summary>
public sealed class AdminBootstrap(IServiceProvider services, IConfiguration configuration) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var email = configuration["Bootstrap:AdminEmail"];
        if (string.IsNullOrWhiteSpace(email))
        {
            return;
        }

        using var scope = services.CreateScope();
        await PromoteAsync(scope.ServiceProvider, email);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>
    /// Separate from the hosted service so a test can run it against a known
    /// account without restarting the host. Returns false when no account has
    /// that address; the hosted service treats that as "not yet".
    /// </summary>
    public static async Task<bool> PromoteAsync(IServiceProvider scoped, string email)
    {
        var users = scoped.GetRequiredService<UserManager<User>>();
        var roles = scoped.GetRequiredService<RoleManager<Role>>();

        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            return false;
        }

        if (!await roles.RoleExistsAsync(Roles.Admin))
        {
            await roles.CreateAsync(new Role { Name = Roles.Admin });
        }

        if (!await users.IsInRoleAsync(user, Roles.Admin))
        {
            await users.AddToRoleAsync(user, Roles.Admin);
        }

        return true;
    }
}
