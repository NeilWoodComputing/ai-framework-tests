using Fish.Api;
using Fish.Api.Data;
using Fish.Api.Services.TestData;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

if (string.Equals(builder.Environment.EnvironmentName, "Test", StringComparison.OrdinalIgnoreCase))
{
    builder.Configuration.AddEnvironmentVariables(prefix: FishDbContextFactory.TestEnvironmentPrefix);
}

builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();

var connectionString = builder.Configuration.GetConnectionString(FishDbContextFactory.ConnectionName) ?? string.Empty;
builder.Services.AddDbContext<FishDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
        npgsql.MigrationsHistoryTable(
            FishDbContext.MigrationsHistoryTable,
            FishDbContext.MigrationsSchema));
});

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (corsOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
        options.AddDefaultPolicy(policy =>
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));
}

// Registration is decided from Enabled + AllowedEnvironments after the host
// has composed configuration (so a WebApplicationFactory's in-memory
// overrides are visible). The reset key is not read here; it is resolved
// at request time from TestData:Key or the variable named by KeyEnvVar.
var testDataOptions = builder.Configuration.GetSection(TestDataOptions.SectionName).Get<TestDataOptions>()
    ?? new TestDataOptions();
var testDataOn = TestDataRegistration.IsEnabled(testDataOptions, builder.Environment);

builder.Services.AddControllers()
    .ConfigureApplicationPartManager(manager =>
    {
        if (!testDataOn)
        {
            manager.FeatureProviders.Add(new RemoveTestDataController());
        }
    });

if (testDataOn)
{
    builder.Services.AddTestData(builder.Configuration);
}

var app = builder.Build();

if (corsOrigins.Length > 0)
{
    app.UseCors();
}

app.MapHealthChecks("/health");
app.MapControllers();

var migrate = app.Configuration.GetValue("InitialisationSettings:MigrateDatabase", false);
if (migrate && !string.IsNullOrWhiteSpace(connectionString))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<FishDbContext>();
    await db.Database.MigrateAsync();
}

if (testDataOn && app.Configuration.GetValue("TestData:StartupSeed", true))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<ITestDataService>()
        .StartupSeedAsync(CancellationToken.None);
}

await app.RunAsync();

public partial class Program;
