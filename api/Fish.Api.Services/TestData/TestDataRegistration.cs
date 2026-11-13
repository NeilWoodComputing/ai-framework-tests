using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Fish.Api.Services.TestData;

public static class TestDataRegistration
{
    public const string NpgsqlProviderName = "Npgsql.EntityFrameworkCore.PostgreSQL";

    /// <summary>
    /// Environment and flag checks only. The reset key is resolved later,
    /// at request time, from options / configuration so a test host's
    /// in-memory overrides win over any process environment variable.
    /// </summary>
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

        return true;
    }

    /// <summary>
    /// Resolves the reset key: <see cref="TestDataOptions.Key"/> (test-host
    /// configuration) first, then the process environment variable named by
    /// <see cref="TestDataOptions.KeyEnvVar"/>. Never logs or returns the
    /// value to a caller outside the access filter.
    /// </summary>
    public static string? ResolveKey(TestDataOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (!string.IsNullOrEmpty(options.Key))
        {
            return options.Key;
        }

        if (string.IsNullOrEmpty(options.KeyEnvVar))
        {
            return null;
        }

        var fromEnv = Environment.GetEnvironmentVariable(options.KeyEnvVar);
        return string.IsNullOrEmpty(fromEnv) ? null : fromEnv;
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
