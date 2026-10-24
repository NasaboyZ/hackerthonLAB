using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;

namespace Magnetrail.Modules.Regulations;

public static class RegulationsModule
{
    public static IServiceCollection AddRegulationsModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<RegulationsDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Database"), npgsql => npgsql.UseNetTopologySuite()
                .MigrationsHistoryTable("__EFMigrationsHistory", "regulations")));
        return services;
    }

    public static IEndpointRouteBuilder MapRegulationsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/regulations").WithTags("Regulations");
        group.MapGet("", GetRegulations).WithName("GetRegulations");
        group.MapGet("/geojson", GetGeoJson).WithName("GetRegulationsGeoJson");
        group.MapGet("/{id:guid}", GetRegulation).WithName("GetRegulation");
        return endpoints;
    }

    private static async Task<IResult> GetRegulations(RegulationsDbContext db, CancellationToken cancellationToken)
    {
        var rules = await db.Rules.AsNoTracking().Include(rule => rule.Sources).Include(rule => rule.Zones)
            .Where(rule => rule.VerificationStatus == RegulationVerificationStatus.Verified)
            .OrderBy(rule => rule.Jurisdiction).ThenBy(rule => rule.Title)
            .ToListAsync(cancellationToken);
        return Results.Ok(rules.Select(RegulationSummary.From).ToArray());
    }

    private static async Task<IResult> GetRegulation(Guid id, RegulationsDbContext db, CancellationToken cancellationToken)
    {
        var rule = await db.Rules.AsNoTracking().Include(item => item.Sources).Include(item => item.Zones).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return rule is null || rule.VerificationStatus != RegulationVerificationStatus.Verified
            ? Results.NotFound()
            : Results.Ok(RegulationSummary.From(rule));
    }

    private static async Task<IResult> GetGeoJson(string? bbox, RegulationsDbContext db, CancellationToken cancellationToken)
    {
        if (!TryParseBbox(bbox, out var bounds, out var error)) return Results.BadRequest(new { error });

        var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(4326);
        var bboxGeometry = geometryFactory.CreatePolygon(new[]
        {
            new Coordinate(bounds.MinLongitude, bounds.MinLatitude),
            new Coordinate(bounds.MaxLongitude, bounds.MinLatitude),
            new Coordinate(bounds.MaxLongitude, bounds.MaxLatitude),
            new Coordinate(bounds.MinLongitude, bounds.MaxLatitude),
            new Coordinate(bounds.MinLongitude, bounds.MinLatitude),
        });

        var zones = await db.Zones.AsNoTracking()
            .Include(zone => zone.Rule).ThenInclude(rule => rule.Sources)
            .Where(zone => zone.GeometryVerificationStatus == RegulationVerificationStatus.Verified
                && zone.Rule.VerificationStatus == RegulationVerificationStatus.Verified
                && zone.Geometry != null
                && zone.Geometry.Intersects(bboxGeometry))
            .ToListAsync(cancellationToken);

        return Results.Ok(new GeoJsonFeatureCollection(zones.Select(GeoJsonFeature.From).ToArray()));
    }

    private static bool TryParseBbox(string? value, out Bbox bbox, out string error)
    {
        bbox = default;
        error = "bbox must be minLng,minLat,maxLng,maxLat within WGS84 bounds.";
        if (string.IsNullOrWhiteSpace(value)) return false;
        var parts = value.Split(',', StringSplitOptions.TrimEntries);
        if (parts.Length != 4 || !parts.All(part => double.TryParse(part, NumberStyles.Float, CultureInfo.InvariantCulture, out _))) return false;
        var numbers = parts.Select(part => double.Parse(part, CultureInfo.InvariantCulture)).ToArray();
        if (numbers[0] < -180 || numbers[2] > 180 || numbers[1] < -90 || numbers[3] > 90 || numbers[0] >= numbers[2] || numbers[1] >= numbers[3]) return false;
        if (numbers[2] - numbers[0] > 30 || numbers[3] - numbers[1] > 20)
        {
            error = "bbox is too large; request a viewport-sized area.";
            return false;
        }
        bbox = new Bbox(numbers[0], numbers[1], numbers[2], numbers[3]);
        return true;
    }

    private readonly record struct Bbox(double MinLongitude, double MinLatitude, double MaxLongitude, double MaxLatitude);
}

public static class RegulationVerificationStatus
{
    public const string Verified = "verified";
    public const string Pending = "pending";
}

public static class RegulationClassification
{
    public const string Prohibited = "PROHIBITED";
    public const string Restricted = "RESTRICTED";
    public const string Unknown = "UNKNOWN";
    public const string InformationOnly = "INFORMATION_ONLY";
}

public sealed class RegulationRule
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Classification { get; set; } = RegulationClassification.Unknown;
    public string VerificationStatus { get; set; } = RegulationVerificationStatus.Pending;
    public string Jurisdiction { get; set; } = string.Empty;
    public string AuthorityName { get; set; } = string.Empty;
    public DateOnly? SourcePublicationDate { get; set; }
    public DateTimeOffset? LastVerifiedAt { get; set; }
    public DateOnly? ValidFrom { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<RegulationSource> Sources { get; set; } = [];
    public List<RegulationZone> Zones { get; set; } = [];
}

public sealed class RegulationSource
{
    public Guid Id { get; set; }
    public Guid RuleId { get; set; }
    public string AuthorityName { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public string? SourceLabel { get; set; }
    public RegulationRule Rule { get; set; } = null!;
}

public sealed class RegulationZone
{
    public Guid Id { get; set; }
    public Guid RuleId { get; set; }
    public MultiPolygon? Geometry { get; set; }
    public string GeometrySource { get; set; } = string.Empty;
    public string GeometryVerificationStatus { get; set; } = RegulationVerificationStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; }
    public RegulationRule Rule { get; set; } = null!;
}

public sealed class RegulationsDbContext(DbContextOptions<RegulationsDbContext> options) : DbContext(options)
{
    public DbSet<RegulationRule> Rules => Set<RegulationRule>();
    public DbSet<RegulationSource> Sources => Set<RegulationSource>();
    public DbSet<RegulationZone> Zones => Set<RegulationZone>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("regulations");
        modelBuilder.Entity<RegulationRule>(entity =>
        {
            entity.ToTable("rules", table =>
            {
                table.HasCheckConstraint("ck_rules_classification", "classification IN ('PROHIBITED','RESTRICTED','UNKNOWN','INFORMATION_ONLY')");
                table.HasCheckConstraint("ck_rules_verification_status", "verification_status IN ('verified','pending')");
            });
            entity.HasKey(rule => rule.Id);
            entity.Property(rule => rule.Id).HasColumnName("id");
            entity.Property(rule => rule.Title).HasColumnName("title");
            entity.Property(rule => rule.Description).HasColumnName("description");
            entity.Property(rule => rule.Classification).HasColumnName("classification");
            entity.Property(rule => rule.VerificationStatus).HasColumnName("verification_status");
            entity.Property(rule => rule.Jurisdiction).HasColumnName("jurisdiction");
            entity.Property(rule => rule.AuthorityName).HasColumnName("authority_name");
            entity.Property(rule => rule.SourcePublicationDate).HasColumnName("source_publication_date");
            entity.Property(rule => rule.LastVerifiedAt).HasColumnName("last_verified_at");
            entity.Property(rule => rule.ValidFrom).HasColumnName("valid_from");
            entity.Property(rule => rule.ValidUntil).HasColumnName("valid_until");
            entity.Property(rule => rule.CreatedAt).HasColumnName("created_at");
            entity.Property(rule => rule.UpdatedAt).HasColumnName("updated_at");
            entity.Property(rule => rule.Title).HasMaxLength(240).IsRequired();
            entity.Property(rule => rule.Description).IsRequired();
            entity.Property(rule => rule.Classification).HasMaxLength(32).IsRequired();
            entity.Property(rule => rule.VerificationStatus).HasMaxLength(32).IsRequired();
            entity.Property(rule => rule.Jurisdiction).HasMaxLength(120).IsRequired();
            entity.Property(rule => rule.AuthorityName).HasMaxLength(240).IsRequired();
            entity.HasIndex(rule => new { rule.VerificationStatus, rule.Jurisdiction });
            entity.HasMany(rule => rule.Sources).WithOne(source => source.Rule).HasForeignKey(source => source.RuleId);
            entity.HasMany(rule => rule.Zones).WithOne(zone => zone.Rule).HasForeignKey(zone => zone.RuleId);
        });
        modelBuilder.Entity<RegulationSource>(entity =>
        {
            entity.ToTable("sources");
            entity.HasKey(source => source.Id);
            entity.Property(source => source.Id).HasColumnName("id");
            entity.Property(source => source.RuleId).HasColumnName("rule_id");
            entity.Property(source => source.AuthorityName).HasColumnName("authority_name");
            entity.Property(source => source.SourceUrl).HasColumnName("source_url");
            entity.Property(source => source.SourceLabel).HasColumnName("source_label");
            entity.Property(source => source.SourceUrl).HasMaxLength(1000).IsRequired();
            entity.Property(source => source.AuthorityName).HasMaxLength(240).IsRequired();
            entity.HasIndex(source => source.RuleId);
        });
        modelBuilder.Entity<RegulationZone>(entity =>
        {
            entity.ToTable("zones", table =>
            {
                table.HasCheckConstraint("ck_zones_geometry_verification_status", "geometry_verification_status IN ('verified','pending')");
            });
            entity.HasKey(zone => zone.Id);
            entity.Property(zone => zone.Id).HasColumnName("id");
            entity.Property(zone => zone.RuleId).HasColumnName("rule_id");
            entity.Property(zone => zone.Geometry).HasColumnType("geometry (multipolygon,4326)");
            entity.Property(zone => zone.Geometry).HasColumnName("geometry");
            entity.Property(zone => zone.GeometrySource).HasColumnName("geometry_source");
            entity.Property(zone => zone.GeometryVerificationStatus).HasColumnName("geometry_verification_status");
            entity.Property(zone => zone.CreatedAt).HasColumnName("created_at");
            entity.Property(zone => zone.GeometrySource).HasMaxLength(240).IsRequired();
            entity.Property(zone => zone.GeometryVerificationStatus).HasMaxLength(32).IsRequired();
            entity.HasIndex(zone => zone.Geometry).HasMethod("gist");
        });
    }
}

public sealed record RegulationSummary(Guid Id, string Title, string Description, string Classification, string VerificationStatus, string Jurisdiction, string AuthorityName, DateTimeOffset? LastVerifiedAt, bool HasVerifiedGeometry, IReadOnlyList<RegulationSourceSummary> Sources)
{
    public static RegulationSummary From(RegulationRule rule) => new(rule.Id, rule.Title, rule.Description, rule.Classification, rule.VerificationStatus, rule.Jurisdiction, rule.AuthorityName, rule.LastVerifiedAt, rule.Zones.Any(zone => zone.GeometryVerificationStatus == RegulationVerificationStatus.Verified && zone.Geometry is not null), rule.Sources.Select(source => new RegulationSourceSummary(source.AuthorityName, source.SourceLabel, source.SourceUrl)).ToArray());
}

public sealed record RegulationSourceSummary(string AuthorityName, string? Label, string Url);
public sealed record GeoJsonFeatureCollection(IReadOnlyList<GeoJsonFeature> Features, string Type = "FeatureCollection");

public sealed record GeoJsonFeature(object Geometry, object Properties, string Type = "Feature")
{
    public static GeoJsonFeature From(RegulationZone zone) => new(
        new { type = "MultiPolygon", coordinates = zone.Geometry!.Geometries.OfType<Polygon>().Select(polygon => new object[] { polygon.ExteriorRing.Coordinates.Select(coordinate => new[] { coordinate.X, coordinate.Y }).ToArray(), polygon.InteriorRings.Select(ring => ring.Coordinates.Select(coordinate => new[] { coordinate.X, coordinate.Y }).ToArray()).ToArray() }).ToArray() },
        new { id = zone.Rule.Id, title = zone.Rule.Title, description = zone.Rule.Description, classification = zone.Rule.Classification, jurisdiction = zone.Rule.Jurisdiction, authorityName = zone.Rule.AuthorityName, lastVerifiedAt = zone.Rule.LastVerifiedAt, sources = zone.Rule.Sources.Select(source => new { label = source.SourceLabel, url = source.SourceUrl }).ToArray() });
}
