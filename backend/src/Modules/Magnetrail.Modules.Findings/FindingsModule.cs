using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

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
            entity.Property(x => x.Visibility).HasConversion<string>().HasMaxLength(20).HasDefaultValue(FindingVisibility.Private);
            entity.Property(x => x.Location).HasColumnType("geometry (point,4326)");
            entity.ToTable(table => table.HasCheckConstraint("ck_finds_weight_non_negative", "weight_grams IS NULL OR weight_grams >= 0"));
            entity.HasIndex(x => x.Location).HasMethod("gist");
        });
        modelBuilder.Entity<FindingMedia>(entity =>
        {
            entity.ToTable("media"); entity.HasKey(x => x.Id);
            entity.Property(x => x.FindingId).HasColumnName("finding_id");
            entity.Property(x => x.StorageKey).HasColumnName("storage_key").HasMaxLength(512).IsRequired();
            entity.HasOne<Finding>().WithMany().HasForeignKey(x => x.FindingId);
        });
    }
}


