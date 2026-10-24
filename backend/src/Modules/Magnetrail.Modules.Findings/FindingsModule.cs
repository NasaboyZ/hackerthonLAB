using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Magnetrail.BuildingBlocks;

namespace Magnetrail.Modules.Findings;

public static class FindingsModule
{
    public static IServiceCollection AddFindingsModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<FindingsDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Database"), npgsql => npgsql.UseNetTopologySuite()
                .MigrationsHistoryTable("__EFMigrationsHistory", "findings")));
        return services;
    }

    public static IEndpointRouteBuilder MapFindingsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/findings").WithTags("Findings").RequireAuthorization().AddEndpointFilter(async (context, next) =>
        {
            if (HttpMethods.IsGet(context.HttpContext.Request.Method)) return await next(context);
            var antiforgery = context.HttpContext.RequestServices.GetRequiredService<IAntiforgery>();
            try { await antiforgery.ValidateRequestAsync(context.HttpContext); return await next(context); }
            catch (AntiforgeryValidationException) { return Results.BadRequest(new { message = "Ungültige Anfrage." }); }
        });

        group.MapGet("", async (ClaimsPrincipal principal, FindingsDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            var findings = await db.Finds.AsNoTracking()
                .Include(finding => finding.Media)
                .Where(finding => finding.OwnerUserId == userId)
                .OrderByDescending(finding => finding.FoundAt)
                .ToListAsync(cancellationToken);
            return Results.Ok(findings.Select(ToResponse).ToArray());
        });

        group.MapPost("", async (ClaimsPrincipal principal, CreateFindingRequest request, FindingsDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            if (!Validate(request.Title, request.Description, request.Category, request.FoundAt, request.WeightGrams, request.Longitude, request.Latitude, request.Visibility, out var errors))
                return Results.ValidationProblem(errors);

            var finding = new Finding
            {
                Id = Guid.NewGuid(), OwnerUserId = userId.Value, Title = request.Title.Trim(), Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim(), FoundAt = request.FoundAt, WeightGrams = request.WeightGrams,
                Visibility = request.Visibility ?? FindingVisibility.Private, Location = CreateLocation(request.Longitude, request.Latitude), CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
            };
            db.Finds.Add(finding);
            await db.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/v1/findings/{finding.Id}", ToResponse(finding));
        });

        group.MapPatch("/{id:guid}", async (Guid id, ClaimsPrincipal principal, UpdateFindingRequest request, FindingsDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            if (!Validate(request.Title, request.Description, request.Category, request.FoundAt, request.WeightGrams, request.Longitude, request.Latitude, request.Visibility, out var errors))
                return Results.ValidationProblem(errors);
            var finding = await db.Finds.Include(value => value.Media).SingleOrDefaultAsync(value => value.Id == id && value.OwnerUserId == userId, cancellationToken);
            if (finding is null) return Results.NotFound();
            finding.Title = request.Title.Trim(); finding.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(); finding.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
            finding.FoundAt = request.FoundAt; finding.WeightGrams = request.WeightGrams; finding.Visibility = request.Visibility ?? FindingVisibility.Private; finding.Location = CreateLocation(request.Longitude, request.Latitude); finding.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToResponse(finding));
        });

        group.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal principal, FindingsDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = AuthenticatedUser.GetId(principal);
            if (userId is null) return Results.Unauthorized();
            var finding = await db.Finds.SingleOrDefaultAsync(value => value.Id == id && value.OwnerUserId == userId, cancellationToken);
            if (finding is null) return Results.NotFound();
            db.Finds.Remove(finding); await db.SaveChangesAsync(cancellationToken); return Results.NoContent();
        });

        return endpoints;
    }

    private static bool Validate(string title, string? description, string? category, DateTimeOffset foundAt, int? weightGrams, double? longitude, double? latitude, FindingVisibility? visibility, out Dictionary<string, string[]> errors)
    {
        errors = new Dictionary<string, string[]>();
        if (!FindingRules.IsValidTitle(title)) errors["title"] = ["Der Titel ist erforderlich und darf höchstens 120 Zeichen enthalten."];
        if (!FindingRules.IsValidDescription(description)) errors["description"] = ["Die Beschreibung darf höchstens 4000 Zeichen enthalten."];
        if (!FindingRules.IsValidCategory(category)) errors["category"] = ["Die Kategorie darf höchstens 40 Zeichen enthalten."];
        if (foundAt > DateTimeOffset.UtcNow.AddMinutes(1)) errors["foundAt"] = ["Das Funddatum darf nicht in der Zukunft liegen."];
        if (!FindingRules.IsValidWeight(weightGrams)) errors["weightGrams"] = ["Das Gewicht darf nicht negativ sein."];
        if (!FindingRules.IsValidLocation(longitude, latitude)) errors["location"] = ["Der Standort ist ungültig."];
        if (visibility is not null and not (FindingVisibility.Private or FindingVisibility.Public)) errors["visibility"] = ["Die Sichtbarkeit ist ungültig."];
        return errors.Count == 0;
    }

    private static Point? CreateLocation(double? longitude, double? latitude) => longitude is null || latitude is null ? null : new GeometryFactory(new PrecisionModel(), 4326).CreatePoint(new Coordinate(longitude.Value, latitude.Value));
    private static object ToResponse(Finding finding) => new { id = finding.Id, title = finding.Title, description = finding.Description, category = finding.Category, foundAt = finding.FoundAt, weightGrams = finding.WeightGrams, visibility = finding.Visibility.ToString().ToLowerInvariant(), geometry = finding.Location is null ? null : new { type = "Point", coordinates = new[] { finding.Location.X, finding.Location.Y } }, media = finding.Media.Select(media => new { id = media.Id, storageKey = media.StorageKey }).ToArray(), createdAt = finding.CreatedAt, updatedAt = finding.UpdatedAt };
}

public enum FindingVisibility { Private, Public }

public sealed class Finding
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public DateTimeOffset FoundAt { get; set; }
    public Point? Location { get; set; }
    public int? WeightGrams { get; set; }
    public FindingVisibility Visibility { get; set; } = FindingVisibility.Private;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<FindingMedia> Media { get; set; } = [];
}

public sealed class FindingMedia
{
    public Guid Id { get; set; }
    public Guid FindingId { get; set; }
    public string StorageKey { get; set; } = string.Empty;
}

public sealed class FindingsDbContext(DbContextOptions<FindingsDbContext> options) : DbContext(options)
{
    public DbSet<Finding> Finds => Set<Finding>();
    public DbSet<FindingMedia> Media => Set<FindingMedia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("findings");
        modelBuilder.Entity<Finding>(entity =>
        {
            entity.ToTable("finds"); entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(40);
            entity.Property(x => x.Visibility).HasConversion(value => value.ToString().ToLowerInvariant(), value => Enum.Parse<FindingVisibility>(value, true)).HasMaxLength(20).HasDefaultValue(FindingVisibility.Private);
            entity.Property(x => x.Location).HasColumnType("geometry (point,4326)");
            entity.ToTable(table => table.HasCheckConstraint("ck_finds_weight_non_negative", "weight_grams IS NULL OR weight_grams >= 0"));
            entity.HasIndex(x => x.Location).HasMethod("gist");
        });
        modelBuilder.Entity<FindingMedia>(entity =>
        {
            entity.ToTable("media"); entity.HasKey(x => x.Id);
            entity.Property(x => x.FindingId).HasColumnName("finding_id");
            entity.Property(x => x.StorageKey).HasColumnName("storage_key").HasMaxLength(512).IsRequired();
            entity.HasOne<Finding>().WithMany(finding => finding.Media).HasForeignKey(x => x.FindingId);
        });
    }
}

public static class FindingRules
{
    public static bool IsValidTitle(string value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 120;
    public static bool IsValidDescription(string? value) => value is null || value.Length <= 4000;
    public static bool IsValidCategory(string? value) => value is null || value.Length <= 40;
    public static bool IsValidWeight(int? value) => value is null or >= 0;
    public static bool IsValidLocation(double? longitude, double? latitude) => (longitude is null && latitude is null) || longitude is >= -180 and <= 180 && latitude is >= -90 and <= 90;
}

public sealed record CreateFindingRequest(string Title, string? Description, string? Category, DateTimeOffset FoundAt, int? WeightGrams, double? Longitude, double? Latitude, FindingVisibility? Visibility);
public sealed record UpdateFindingRequest(string Title, string? Description, string? Category, DateTimeOffset FoundAt, int? WeightGrams, double? Longitude, double? Latitude, FindingVisibility? Visibility);


