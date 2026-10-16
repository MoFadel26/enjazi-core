using Enjazi.Api.Auth;
using Enjazi.Api.Data;
using Enjazi.Api.Data.Entities;
using Enjazi.Api.Hubs;
using Enjazi.Api.Streaks;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(builder.Configuration.GetConnectionString("Default"))
    .UseSnakeCaseNamingConvention());

// The keys that sign the auth cookie live in the database. The default is a
// folder inside the container, which a restart or a new revision replaces,
// and every cookie signed with the old keys stops working. The application
// name fixes the key isolation, which otherwise follows the content root path.
builder.Services.AddDataProtection()
    .SetApplicationName("enjazi-core")
    .PersistKeysToDbContext<AppDbContext>();

builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

// Azure Container Apps ends TLS at its ingress and forwards plain HTTP, adding
// X-Forwarded-For and X-Forwarded-Proto. Reading them makes a request that
// arrived over HTTPS look like one, so the HTTPS redirect does not loop and
// the request scheme matches the Secure cookie. The ingress proxy's address
// is not fixed, so every proxy is trusted; the container has no other way in.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// AddIdentityCore, not AddIdentity: AddIdentity would also register cookie
// schemes of its own, and the one below is configured deliberately.
builder.Services
    .AddIdentityCore<User>(options =>
    {
        options.User.RequireUniqueEmail = true;

        // Length instead of composition rules. Identity's defaults demand a
        // digit, an upper-case letter and a symbol at six characters, which
        // rejects a twelve-character passphrase and accepts "Pass1!".
        options.Password.RequiredLength = 12;
        options.Password.RequireDigit = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;

        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<Role>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

builder.Services
    .AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddCookie(IdentityConstants.ApplicationScheme, options =>
    {
        // Named for this application. An older project on this machine sets a
        // cookie named "jwt" on localhost; sharing a name would log users out
        // of one app by using the other.
        options.Cookie.Name = "enjazi_core_auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromDays(14);
        options.SlidingExpiration = true;

        // The defaults redirect to /Account/Login, which an API client cannot
        // use. Return the status code instead.
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.Admin, policy => policy.RequireRole(Roles.Admin));

builder.Services.AddHostedService<AdminBootstrap>();

// The streak asks the clock what day it is, and the tests move that clock
// rather than wait for midnight. It is keyed so it is the streak's clock and
// nobody else's: an unkeyed TimeProvider is also picked up by cookie
// authentication, and a moved clock there moves cookie expiry with it.
builder.Services.AddKeyedSingleton(StreakClock.Key, TimeProvider.System);
builder.Services.AddScoped<StreakService>();

// The hub is push-only; see RoomHub. It authenticates with the same cookie as
// the controllers, which the browser sends on the WebSocket upgrade because
// the hub is on the app's own origin (ADR-0008).
builder.Services.AddSignalR();

// Enums travel as their names, not their storage integers, so the OpenAPI
// document lists the values and the generated client gets a union type
// instead of "number". Integers are still accepted on input. MVC serialises
// with its own options and the OpenAPI generator reads the Http ones, so
// both get the converter or the document would disagree with the wire.
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddOpenApi(options =>
{
    // MVC does not set operationId. Client generators name functions after
    // it, so derive one from the controller and action: Tasks_Get, Auth_Login.
    options.AddOperationTransformer((operation, context, _) =>
    {
        if (context.Description.ActionDescriptor is ControllerActionDescriptor action)
        {
            operation.OperationId = $"{action.ControllerName}_{action.ActionName}";
        }

        return Task.CompletedTask;
    });
});

var app = builder.Build();

// Set by the container image only. Not tied to the Production environment,
// because the build-time OpenAPI generator also runs this file as Production
// and has no database. One replica at most, so no two instances race to
// migrate. Runs before the host starts, so before AdminBootstrap.
if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Before the HTTPS redirect: the platform's health probes call the container
// directly over plain HTTP, and a redirect would pass as healthy without the
// database being checked.
app.UseHealthChecks("/healthz");

app.UseHttpsRedirection();

// The built React app, copied into wwwroot by the Dockerfile. In development
// there is no wwwroot and Vite serves the app instead.
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RoomHub>("/hubs/rooms");

// Client routes such as /tasks are the React router's, so a hard refresh on
// one gets index.html. Paths under /api and /hubs are excluded and stay 404,
// so a wrong API call fails instead of answering with a web page. nonfile
// keeps a missing /assets/x.js a 404 too.
app.MapFallbackToFile("{*path:nonfile:regex(^(?!(api|hubs)(/|$)))}", "index.html");

app.Run();

// Needed by WebApplicationFactory<Program> in the test project; top-level
// statements otherwise compile to an internal class.
public partial class Program;
