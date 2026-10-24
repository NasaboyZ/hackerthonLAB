using Magnetrail.Modules.Identity;

public static class DatabaseSchemaInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, string contentRootPath)
    {
        var schemaPath = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "schema", "001_initial_schema.sql"),
            Path.Combine(contentRootPath, "infra", "docker", "001_initial_schema.sql"),
            Path.GetFullPath(Path.Combine(contentRootPath, "..", "..", "..", "infra", "docker", "001_initial_schema.sql"))
        }.FirstOrDefault(File.Exists);

        if (schemaPath is null)
        {
            throw new FileNotFoundException("The database schema script was not found.");
        }

        await using var scope = services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<MagnetrailIdentityDbContext>();
        database.Database.SetCommandTimeout(TimeSpan.FromMinutes(2));
        await database.Database.ExecuteSqlRawAsync(await File.ReadAllTextAsync(schemaPath));
    }
}
