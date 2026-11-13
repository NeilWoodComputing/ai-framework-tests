using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Fish.Api.Services.TestData;

public static class TestDataRegistration
{
    public const string NpgsqlProviderName = "Npgsql.EntityFrameworkCore.PostgreSQL";

    public static bool IsEnabled(TestDataOptions options, IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(environment);

        if (environment.IsProduction() && options.Enabled)
        {
            throw new InvalidOperationException("TestData must never be enabled in Production.");
        }

        if (!options.Enabled)
        {
            return false;
        }

        if (!options.AllowedEnvironments.Contains(environment.EnvironmentName, StringComparer.OrdinalIgnoreCase))
        {
            return false;
        }

        var key = Environment.GetEnvironmentVariable(options.KeyEnvVar);
        return !string.IsNullOrEmpty(key);
    }

    public static IServiceCollection AddTestData(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<TestDataOptions>(configuration.GetSection(TestDataOptions.SectionName));
        services.AddScoped<TestDataGuard>();
        services.AddScoped<TestDataAccessFilter>();
        services.AddScoped<ITestDataService, TestDataService>();
        services.AddScoped<ITestSeedUnit, MigrationSeedUnit>();
        return services;
    }
}
