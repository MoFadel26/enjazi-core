using Enjazi.Api.Data;
using Enjazi.Api.Streaks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Enjazi.Api.Tests;

/// <summary>
/// Hosts the API in memory against a throwaway Postgres container. The real
/// provider matters here: the point of these tests is what Postgres and EF
/// Core enforce, which a different engine would not reproduce.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();

        // Touching Services builds the host, which reads the connection string
        // set below, so the container has to be running first.
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    /// <summary>
    /// The clock the streak reads, replaced under the streak's key only. It
    /// was first registered as the plain TimeProvider, which the cookie
    /// authentication of the time also read: every cookie was then issued as
    /// expiring in March 2026 and the test client's cookie jar dropped it.
    /// </summary>
    public FakeClock Clock { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", _postgres.GetConnectionString());
        builder.UseSetting("Clerk:AuthorizedParties:0", TestTokens.Origin);
        builder.UseSetting("Guest:SigningKey", TestTokens.GuestKey);
        // The production default. The test host runs as Development, whose
        // appsettings raise it for local browser runs.
        builder.UseSetting("Guest:PermitsPerHour", "5");
        builder.ConfigureTestServices(services =>
        {
            services.AddKeyedSingleton<TimeProvider>(StreakClock.Key, Clock);

            // Runs after ClerkAuthentication.Configure and before the handler
            // builds its configuration manager, so with no Authority it never
            // fetches Clerk's JWKS and validates against the test key instead.
            services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.Authority = null;
                options.TokenValidationParameters.ValidIssuer = TestTokens.Issuer;
                options.TokenValidationParameters.IssuerSigningKey = TestTokens.Key;
            });
        });
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}

/// <summary>
/// One container and one host for every test class, rather than one per class.
/// </summary>
[CollectionDefinition(nameof(ApiCollection))]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>;

public sealed class FakeClock : TimeProvider
{
    public DateTimeOffset Now { get; set; } = new(2026, 3, 10, 12, 0, 0, TimeSpan.Zero);

    public override DateTimeOffset GetUtcNow() => Now;
}
