using Enjazi.Api.Data;
using Enjazi.Api.Streaks;
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
    /// was first registered as the plain TimeProvider, which cookie
    /// authentication also reads: every cookie was then issued as expiring
    /// in March 2026 and the test client's real-time cookie jar dropped it.
    /// </summary>
    public FakeClock Clock { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", _postgres.GetConnectionString());
        builder.ConfigureTestServices(services => services.AddKeyedSingleton<TimeProvider>(StreakClock.Key, Clock));
    }

    /// <summary>
    /// The auth cookie is marked Secure, so a client on http would be handed
    /// the cookie and then never send it back. TestServer honours the scheme
    /// of the base address without doing real TLS.
    /// </summary>
    public HttpClient CreateHttpsClient() => CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
    });

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
