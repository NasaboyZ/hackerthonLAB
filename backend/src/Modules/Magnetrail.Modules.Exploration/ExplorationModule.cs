using System.Security.Claims;
using Magnetrail.BuildingBlocks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetTopologySuite.Geometries;
using System.Text.Json;

namespace Magnetrail.Modules.Exploration;

public static class ExplorationModule
{
    public static IServiceCollection AddExplorationModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ExplorationDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Database"), npgsql => npgsql.UseNetTopologySuite()
                .MigrationsHistoryTable("__EFMigrationsHistory", "exploration")));
        return services;
    }
}

public abstract class OwnedGeometry
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Visibility { get; set; } = "private";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class ExplorationSpot : OwnedGeometry { public Point Location { get; set; } = null!; }
public sealed class ExplorationTrack : OwnedGeometry { public LineString Path { get; set; } = null!; public DateTimeOffset StartedAt { get; set; } public DateTimeOffset EndedAt { get; set; } }
public sealed class ExplorationArea : OwnedGeometry { public MultiPolygon Boundary { get; set; } = null!; }

public sealed class ExplorationDbContext(DbContextOptions<ExplorationDbContext> options) : DbContext(options)
{
    public DbSet<ExplorationSpot> Spots => Set<ExplorationSpot>();
    public DbSet<ExplorationTrack> Tracks => Set<ExplorationTrack>();
    public DbSet<ExplorationArea> Areas => Set<ExplorationArea>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("exploration");
        modelBuilder.Entity<ExplorationSpot>(e =>
        {
            ConfigureBase(e, "spots");
            e.Property(x => x.Location).HasColumnName("location").HasColumnType("geometry (point,4326)");
            e.HasIndex(x => x.Location).HasMethod("gist");
        });
        modelBuilder.Entity<ExplorationTrack>(e =>
        {
            ConfigureBase(e, "tracks");
            e.Property(x => x.Path).HasColumnName("path").HasColumnType("geometry (linestring,4326)");
            e.HasIndex(x => x.Path).HasMethod("gist");
        });
        modelBuilder.Entity<ExplorationArea>(e =>
        {
            ConfigureBase(e, "areas");
            e.Property(x => x.Boundary).HasColumnName("boundary").HasColumnType("geometry (multipolygon,4326)");
            e.HasIndex(x => x.Boundary).HasMethod("gist");
        });
    }

    private static void ConfigureBase<TEntity>(EntityTypeBuilder<TEntity> entity, string table) where TEntity : OwnedGeometry
    {
        entity.ToTable(table); entity.HasKey(x => x.Id);
        entity.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
        entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        entity.Property(x => x.Visibility).HasMaxLength(20).HasDefaultValue("private");
    }
}

public sealed record CreateSpotRequest(string Name, double Longitude, double Latitude, string? Visibility);
public sealed record CreateAreaRequest(string Name, JsonElement Coordinates, string? Visibility);

public static class ExplorationEndpoints
{
    public static IEndpointRouteBuilder MapExplorationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/places").WithTags("Places").RequireAuthorization().AddEndpointFilter(async (context, next) =>
        {
            if (HttpMethods.IsGet(context.HttpContext.Request.Method)) return await next(context);
            var antiforgery = context.HttpContext.RequestServices.GetRequiredService<IAntiforgery>();
            try { await antiforgery.ValidateRequestAsync(context.HttpContext); return await next(context); }
            catch (AntiforgeryValidationException) { return Results.BadRequest(new { message = "Ungültige Anfrage." }); }
        });

        group.MapGet("", async (ClaimsPrincipal principal, ExplorationDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            var spots = await db.Spots.AsNoTracking()
                .Where(place => place.OwnerUserId == userId)
                .ToListAsync(cancellationToken);
            var areas = await db.Areas.AsNoTracking()
                .Where(place => place.OwnerUserId == userId)
                .ToListAsync(cancellationToken);

            var places = spots.Select(place => (place.CreatedAt, Payload: (object)ToSpotResponse(place)))
                .Concat(areas.Select(place => (place.CreatedAt, Payload: (object)ToAreaResponse(place))))
                .OrderByDescending(place => place.CreatedAt)
                .Select(place => place.Payload);
            return Results.Ok(places);
        });

        group.MapPost("/spots", async (ClaimsPrincipal principal, CreateSpotRequest request, ExplorationDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            if (!IsValidName(request.Name) || !IsValidVisibility(request.Visibility) || !IsValidCoordinate(request.Longitude, request.Latitude))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["place"] = ["Name, Sichtbarkeit und Koordinaten sind ungültig."] });

            var place = new ExplorationSpot
            {
                OwnerUserId = userId.Value,
                Name = request.Name.Trim(),
                Visibility = request.Visibility ?? "private",
                Location = new GeometryFactory(new PrecisionModel(), 4326).CreatePoint(new Coordinate(request.Longitude, request.Latitude)),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            db.Spots.Add(place);
            await db.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/v1/places/{place.Id}", ToSpotResponse(place));
        });

        group.MapPost("/areas", async (ClaimsPrincipal principal, CreateAreaRequest request, ExplorationDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            if (!IsValidName(request.Name) || !IsValidVisibility(request.Visibility))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["place"] = ["Name und Sichtbarkeit sind ungültig."] });

            try
            {
                var boundary = CreateBoundary(request.Coordinates);
                if (!boundary.IsValid || boundary.Area <= 0) throw new ArgumentException();
                var place = new ExplorationArea
                {
                    OwnerUserId = userId.Value,
                    Name = request.Name.Trim(),
                    Visibility = request.Visibility ?? "private",
                    Boundary = boundary,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow,
                };
                db.Areas.Add(place);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Created($"/api/v1/places/{place.Id}", ToAreaResponse(place));
            }
            catch (ArgumentException)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["coordinates"] = ["Die Suchfläche ist keine gültige MultiPolygon-Geometrie."] });
            }
        });

        group.MapDelete("/{id:guid}", async (ClaimsPrincipal principal, Guid id, ExplorationDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            var spot = await db.Spots.FirstOrDefaultAsync(place => place.Id == id && place.OwnerUserId == userId, cancellationToken);
            if (spot is not null) { db.Spots.Remove(spot); await db.SaveChangesAsync(cancellationToken); return Results.NoContent(); }
            var area = await db.Areas.FirstOrDefaultAsync(place => place.Id == id && place.OwnerUserId == userId, cancellationToken);
            if (area is not null) { db.Areas.Remove(area); await db.SaveChangesAsync(cancellationToken); return Results.NoContent(); }
            return Results.NotFound();
        });

        return endpoints;
    }

    private static object ToSpotResponse(ExplorationSpot place) => ToResponse(place, "spot", new { type = "Point", coordinates = new[] { place.Location.X, place.Location.Y } });

    private static object ToAreaResponse(ExplorationArea place) => ToResponse(place, "area", new { type = "MultiPolygon", coordinates = place.Boundary.Geometries.Select(polygon => new[] { polygon.Coordinates.Select(coordinate => new[] { coordinate.X, coordinate.Y }).ToArray() }).ToArray() });

    private static object ToResponse(OwnedGeometry place, string type, object geometry) => new { id = place.Id, name = place.Name, type, visibility = place.Visibility, geometry, createdAt = place.CreatedAt, updatedAt = place.UpdatedAt };

    private static bool IsValidName(string name) => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= 120;
    private static bool IsValidVisibility(string? visibility) => visibility is null or "private" or "public";
    private static bool IsValidCoordinate(double longitude, double latitude) => longitude is >= -180 and <= 180 && latitude is >= -90 and <= 90;

    private static MultiPolygon CreateBoundary(JsonElement coordinates)
    {
        if (coordinates.ValueKind != JsonValueKind.Array || coordinates.GetArrayLength() != 1) throw new ArgumentException();
        var polygon = coordinates[0];
        if (polygon.ValueKind != JsonValueKind.Array || polygon.GetArrayLength() != 1) throw new ArgumentException();
        var ring = polygon[0];
        if (ring.ValueKind != JsonValueKind.Array || ring.GetArrayLength() < 4) throw new ArgumentException();
        var points = ring.EnumerateArray().Select(point =>
        {
            if (point.ValueKind != JsonValueKind.Array || point.GetArrayLength() != 2) throw new ArgumentException();
            var longitude = point[0].GetDouble(); var latitude = point[1].GetDouble();
            if (!IsValidCoordinate(longitude, latitude)) throw new ArgumentException();
            return new Coordinate(longitude, latitude);
        }).ToArray();
        if (!points[0].Equals2D(points[^1])) throw new ArgumentException();
        var factory = new GeometryFactory(new PrecisionModel(), 4326);
        return factory.CreateMultiPolygon([factory.CreatePolygon(factory.CreateLinearRing(points))]);
    }
}


