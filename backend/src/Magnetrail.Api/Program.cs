using Magnetrail.Modules.Exploration;
using Magnetrail.Modules.Findings;
using Magnetrail.Modules.GeoCatalog;
using Magnetrail.Modules.Identity;
using Magnetrail.Modules.Players;
using Magnetrail.Modules.Regulations;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
var configuredCorsOrigins = builder.Configuration["CORS_ORIGINS"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];
var corsOrigins = configuredCorsOrigins.Length > 0 ? configuredCorsOrigins : ["http://localhost:3000", "http://127.0.0.1:3000"];
builder.Services.AddCors(options => options.AddPolicy("web", policy => policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddPlayersModule(builder.Configuration);
builder.Services.AddFindingsModule(builder.Configuration);
builder.Services.AddExplorationModule(builder.Configuration);
builder.Services.AddGeoCatalogModule(builder.Configuration);
builder.Services.AddRegulationsModule(builder.Configuration);

var app = builder.Build();

if (builder.Configuration.GetValue("DATABASE_INITIALIZE_SCHEMA", builder.Environment.IsProduction()))
{
    await DatabaseSchemaInitializer.InitializeAsync(app.Services, builder.Environment.ContentRootPath);
}

app.UseExceptionHandler();
app.UseCors("web");
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapIdentityEndpoints();
app.MapPlayersEndpoints();
app.MapFindingsEndpoints();
app.MapRegulationsEndpoints();
app.MapExplorationEndpoints();

app.MapGet("/", () => Results.Ok(new { name = "Magnetrail API", version = "1.0" }));

app.Run();

public partial class Program { }

