using System.Security.Claims;
using Magnetrail.BuildingBlocks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Magnetrail.Modules.Identity;

public sealed class MagnetrailUser : IdentityUser<Guid>
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class MagnetrailIdentityDbContext(DbContextOptions<MagnetrailIdentityDbContext> options)
    : IdentityDbContext<MagnetrailUser, IdentityRole<Guid>, Guid>(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("identity");
        modelBuilder.Entity<MagnetrailUser>(entity =>
        {
            entity.ToTable("users");
            entity.Property(user => user.UserName).HasColumnName("user_name");
            entity.Property(user => user.NormalizedUserName).HasColumnName("normalized_user_name");
            entity.Property(user => user.Email).HasColumnName("email");
            entity.Property(user => user.NormalizedEmail).HasColumnName("normalized_email");
            entity.Property(user => user.EmailConfirmed).HasColumnName("email_confirmed");
            entity.Property(user => user.PasswordHash).HasColumnName("password_hash");
            entity.Property(user => user.SecurityStamp).HasColumnName("security_stamp");
            entity.Property(user => user.ConcurrencyStamp).HasColumnName("concurrency_stamp");
            entity.Property(user => user.PhoneNumber).HasColumnName("phone_number");
            entity.Property(user => user.PhoneNumberConfirmed).HasColumnName("phone_number_confirmed");
            entity.Property(user => user.TwoFactorEnabled).HasColumnName("two_factor_enabled");
            entity.Property(user => user.LockoutEnd).HasColumnName("lockout_end");
            entity.Property(user => user.LockoutEnabled).HasColumnName("lockout_enabled");
            entity.Property(user => user.AccessFailedCount).HasColumnName("access_failed_count");
            entity.Property(user => user.CreatedAt).HasColumnName("created_at");
            entity.Property(user => user.UpdatedAt).HasColumnName("updated_at");
        });
        modelBuilder.Entity<IdentityRole<Guid>>(entity =>
        {
            entity.ToTable("roles"); entity.Property(role => role.Id).HasColumnName("id"); entity.Property(role => role.Name).HasColumnName("name"); entity.Property(role => role.NormalizedName).HasColumnName("normalized_name"); entity.Property(role => role.ConcurrencyStamp).HasColumnName("concurrency_stamp");
        });
        modelBuilder.Entity<IdentityUserClaim<Guid>>(entity =>
        {
            entity.ToTable("user_claims"); entity.Property(claim => claim.Id).HasColumnName("id"); entity.Property(claim => claim.UserId).HasColumnName("user_id"); entity.Property(claim => claim.ClaimType).HasColumnName("claim_type"); entity.Property(claim => claim.ClaimValue).HasColumnName("claim_value");
        });
        modelBuilder.Entity<IdentityUserLogin<Guid>>(entity =>
        {
            entity.ToTable("user_logins"); entity.Property(login => login.LoginProvider).HasColumnName("login_provider"); entity.Property(login => login.ProviderKey).HasColumnName("provider_key"); entity.Property(login => login.ProviderDisplayName).HasColumnName("provider_display_name"); entity.Property(login => login.UserId).HasColumnName("user_id");
        });
        modelBuilder.Entity<IdentityUserToken<Guid>>(entity =>
        {
            entity.ToTable("user_tokens"); entity.Property(token => token.UserId).HasColumnName("user_id"); entity.Property(token => token.LoginProvider).HasColumnName("login_provider"); entity.Property(token => token.Name).HasColumnName("name"); entity.Property(token => token.Value).HasColumnName("value");
        });
        modelBuilder.Entity<IdentityRoleClaim<Guid>>(entity =>
        {
            entity.ToTable("role_claims"); entity.Property(claim => claim.Id).HasColumnName("id"); entity.Property(claim => claim.RoleId).HasColumnName("role_id"); entity.Property(claim => claim.ClaimType).HasColumnName("claim_type"); entity.Property(claim => claim.ClaimValue).HasColumnName("claim_value");
        });
    }
}

public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<MagnetrailIdentityDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("Database"), npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "identity")));
        services.AddIdentityCore<MagnetrailUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 12;
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.AllowedForNewUsers = true;
        }).AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<MagnetrailIdentityDbContext>().AddSignInManager().AddDefaultTokenProviders();
        services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies(options =>
        {
            options.ApplicationCookie!.Configure(cookie =>
            {
                cookie.Cookie.Name = "magnetrail_session";
                cookie.Cookie.HttpOnly = true;
                cookie.Cookie.SameSite = SameSiteMode.Lax;
                cookie.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                cookie.ExpireTimeSpan = TimeSpan.FromHours(8);
                cookie.SlidingExpiration = true;
                cookie.Events.OnRedirectToLogin = context => { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
                cookie.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
            });
        });
        services.AddAuthorization();
        services.AddAntiforgery(options => options.HeaderName = "X-CSRF-TOKEN");
        return services;
    }

    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/auth").WithTags("Authentication");
        group.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) => { var tokens = antiforgery.GetAndStoreTokens(context); return Results.Ok(new { token = tokens.RequestToken }); });
        group.MapPost("/register", async (HttpContext context, IAntiforgery antiforgery, RegisterRequest request, UserManager<MagnetrailUser> users, SignInManager<MagnetrailUser> signIn, IPlayerProfileProvisioner profiles, CancellationToken cancellationToken) =>
        {
            if (!await IsCsrfValid(context, antiforgery)) return Results.BadRequest(new { message = "Ungültige Anfrage." });
            var username = request.Username.Trim();
            if (!ValidationRules.IsUsername(username) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || request.Password != request.ConfirmPassword)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["registration"] = ["Die Registrierungsdaten sind ungültig."] });
            var email = request.Email.Trim();
            var user = new MagnetrailUser { Id = Guid.NewGuid(), UserName = email, Email = email, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
            var result = await users.CreateAsync(user, request.Password);
            if (!result.Succeeded) return Results.ValidationProblem(new Dictionary<string, string[]> { ["registration"] = ["Die Registrierungsdaten sind ungültig oder bereits vergeben."] });
            if (!await profiles.CreateAsync(user.Id, username, cancellationToken))
            {
                await users.DeleteAsync(user);
                return Results.Problem("Das Benutzerprofil konnte nicht erstellt werden.", statusCode: StatusCodes.Status500InternalServerError);
            }
            await signIn.SignInAsync(user, isPersistent: false);
            return Results.Ok(new { id = user.Id, email = user.Email, username, level = 1 });
        });
        group.MapPost("/login", async (HttpContext context, IAntiforgery antiforgery, LoginRequest request, UserManager<MagnetrailUser> users, SignInManager<MagnetrailUser> signIn) =>
        {
            if (!await IsCsrfValid(context, antiforgery)) return Results.BadRequest(new { message = "Ungültige Anfrage." });
            var user = await users.FindByEmailAsync(request.Email.Trim());
            var result = user is null ? SignInResult.Failed : await signIn.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            if (!result.Succeeded) return Results.Json(new { message = "E-Mail oder Passwort ist ungültig." }, statusCode: StatusCodes.Status401Unauthorized);
            await signIn.SignInAsync(user!, isPersistent: false);
            return Results.Ok(new { id = user!.Id, email = user.Email });
        });
        group.MapPost("/logout", async (HttpContext context, IAntiforgery antiforgery, SignInManager<MagnetrailUser> signIn) => { if (!await IsCsrfValid(context, antiforgery)) return Results.BadRequest(new { message = "Ungültige Anfrage." }); await signIn.SignOutAsync(); return Results.NoContent(); }).RequireAuthorization();
        group.MapGet("/me", async (ClaimsPrincipal principal, UserManager<MagnetrailUser> users, IPlayerProfileReader profiles, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            var user = await users.FindByIdAsync(userId.Value.ToString());
            var profile = await profiles.GetAsync(userId.Value, cancellationToken);
            return user is null || profile is null ? Results.NotFound() : Results.Ok(new { id = user.Id, email = user.Email, username = profile.Username, level = profile.Level });
        }).RequireAuthorization();
        return endpoints;
    }

    private static async Task<bool> IsCsrfValid(HttpContext context, IAntiforgery antiforgery)
    {
        try { await antiforgery.ValidateRequestAsync(context); return true; }
        catch (AntiforgeryValidationException) { return false; }
    }
}

public sealed record RegisterRequest(string Email, string Username, string Password, string ConfirmPassword);
public sealed record LoginRequest(string Email, string Password);
