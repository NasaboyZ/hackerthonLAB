using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Magnetrail.BuildingBlocks;

namespace Magnetrail.Modules.Players;

public static class PlayersModule
{
    public static IServiceCollection AddPlayersModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PlayersDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Database"), npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "players")));
        services.AddScoped<IPlayerProfileProvisioner, PlayerProfileService>();
        services.AddScoped<IPlayerProfileReader, PlayerProfileService>();
        return services;
    }
}

public sealed class PlayerProfile
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class PlayerProfileService(PlayersDbContext db) : IPlayerProfileProvisioner, IPlayerProfileReader
{
    public async Task<bool> CreateAsync(Guid userId, string username, CancellationToken cancellationToken)
    {
        if (await db.Profiles.AnyAsync(profile => profile.Username.ToLower() == username.ToLower(), cancellationToken)) return false;
        db.Profiles.Add(new PlayerProfile { UserId = userId, Username = username, Level = 1, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        try { await db.SaveChangesAsync(cancellationToken); return true; } catch (DbUpdateException) { return false; }
    }

    public async Task<PlayerProfileSnapshot?> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await db.Profiles.AsNoTracking().Where(profile => profile.UserId == userId).Select(profile => new PlayerProfileSnapshot(profile.UserId, profile.Username, profile.Level, profile.CreatedAt, profile.UpdatedAt)).SingleOrDefaultAsync(cancellationToken);
    }
}

public sealed record UpdatePlayerProfileRequest(string Username);

public static class PlayersEndpoints
{
    public static IEndpointRouteBuilder MapPlayersEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/players").WithTags("Players").RequireAuthorization();
        group.MapGet("/me", async (ClaimsPrincipal principal, IPlayerProfileReader profiles, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            var profile = await profiles.GetAsync(userId.Value, cancellationToken);
            return profile is null ? Results.NotFound() : Results.Ok(profile);
        });
        group.MapPatch("/me", async (UpdatePlayerProfileRequest request, ClaimsPrincipal principal, PlayersDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            var username = request.Username.Trim();
            if (userId is null) return Results.Unauthorized();
            if (!ValidationRules.IsUsername(username)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["username"] = ["Der Benutzername ist ungültig."] });
            var duplicate = await db.Profiles.AnyAsync(profile => profile.UserId != userId && profile.Username.ToLower() == username.ToLower(), cancellationToken);
            if (duplicate) return Results.Conflict(new { message = "Der Benutzername ist bereits vergeben." });
            var profile = await db.Profiles.SingleOrDefaultAsync(value => value.UserId == userId, cancellationToken);
            if (profile is null) return Results.NotFound();
            profile.Username = username; profile.UpdatedAt = DateTimeOffset.UtcNow;
            try { await db.SaveChangesAsync(cancellationToken); } catch (DbUpdateException) { return Results.Conflict(new { message = "Der Benutzername ist bereits vergeben." }); }
            return Results.Ok(new PlayerProfileSnapshot(profile.UserId, profile.Username, profile.Level, profile.CreatedAt, profile.UpdatedAt));
        });
        return endpoints;
    }

}

public sealed class PlayersDbContext(DbContextOptions<PlayersDbContext> options) : DbContext(options)
{
    public DbSet<PlayerProfile> Profiles => Set<PlayerProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("players");
        modelBuilder.Entity<PlayerProfile>(entity =>
        {
            entity.ToTable("profiles");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.Username).HasMaxLength(32).IsRequired();
            entity.HasIndex(x => x.Username).IsUnique();
            entity.Property(x => x.Level).HasDefaultValue(1);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.ToTable(table => table.HasCheckConstraint("ck_profiles_level_positive", "level >= 1"));
        });
    }
}


