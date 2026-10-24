using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Magnetrail.Modules.GeoCatalog;

public static class GeoCatalogModule
{
    public static IServiceCollection AddGeoCatalogModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<GeoCatalogDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Database"), npgsql => npgsql.UseNetTopologySuite()
                .MigrationsHistoryTable("__EFMigrationsHistory", "geo")));
        return services;
    }
}

public sealed class Waterbody
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string SourceDataset { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? WaterbodyType { get; set; }
    public Geometry? Geometry { get; set; }
    public string? SourceVersion { get; set; }
    public DateTimeOffset ImportedAt { get; set; }
}

public sealed class GeoCatalogDbContext(DbContextOptions<GeoCatalogDbContext> options) : DbContext(options)
{
    public DbSet<Waterbody> Waterbodies => Set<Waterbody>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("geo");
        modelBuilder.Entity<Waterbody>(entity =>
        {
            entity.ToTable("waterbodies");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.ExternalId).HasMaxLength(240);
            entity.Property(item => item.SourceDataset).HasMaxLength(240).IsRequired();
            entity.Property(item => item.Name).HasMaxLength(240);
            entity.Property(item => item.WaterbodyType).HasMaxLength(120);
            entity.Property(item => item.Geometry).HasColumnType("geometry(Geometry,4326)");
            entity.Property(item => item.SourceVersion).HasMaxLength(120);
            entity.HasIndex(item => item.Geometry).HasMethod("gist");
            entity.HasIndex(item => new { item.SourceDataset, item.ExternalId });
        });
    }
}
