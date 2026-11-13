using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Fish.Api.Data;

/// <summary>
/// Design-time factory for <c>dotnet ef</c>. There is no fallback connection
/// string. Values come from user-secrets (Development) or the
/// <c>FISH_TEST_</c> prefixed environment variables (Test only).
/// </summary>
public sealed class FishDbContextFactory : IDesignTimeDbContextFactory<FishDbContext>
{
    public const string ConnectionName = "FishConnection";
    public const string TestEnvironmentPrefix = "FISH_TEST_";
    public const string TestConnectionEnvVar = "FISH_TEST_ConnectionStrings__FishConnection";
    public const string DevelopmentUserSecretsId = "9e2f6c1a-4b73-4d0e-9a8f-1c5d7e3b0a12";

    public FishDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var configuration = BuildConfiguration(environment);
        var connectionString = configuration.GetConnectionString(ConnectionName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{ConnectionName}' is empty. "
                + "For Development, set user-secrets key 'ConnectionStrings:FishConnection'. "
                + $"For Test, set the environment variable {TestConnectionEnvVar}. "
                + "No fallback connection string is provided.");
        }

        var options = new DbContextOptionsBuilder<FishDbContext>();
        options.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsHistoryTable(
                FishDbContext.MigrationsHistoryTable,
                FishDbContext.MigrationsSchema));
        return new FishDbContext(options.Options);
    }

    internal static IConfigurationRoot BuildConfiguration(string environment)
    {
        var apiDir = ResolveApiContentRoot();
        var builder = new ConfigurationBuilder()
            .SetBasePath(apiDir)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true);

        if (string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase))
        {
            var secretsPath = GetUserSecretsPath(DevelopmentUserSecretsId);
            if (secretsPath is not null)
            {
                builder.AddJsonFile(secretsPath, optional: true);
            }
        }

        if (string.Equals(environment, "Test", StringComparison.OrdinalIgnoreCase))
        {
            builder.AddEnvironmentVariables(prefix: TestEnvironmentPrefix);
        }

        return builder.Build();
    }

    internal static string? GetUserSecretsPath(string userSecretsId)
    {
        // Standard user-secrets location. We load the JSON file directly so
        // this Data project does not depend on a UserSecrets API overload.
        string? root = Environment.GetEnvironmentVariable("APPDATA");
        if (string.IsNullOrEmpty(root))
        {
            var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            root = Path.Combine(home, ".microsoft", "usersecrets");
        }
        else
        {
            root = Path.Combine(root, "Microsoft", "UserSecrets");
        }

        var path = Path.Combine(root, userSecretsId, "secrets.json");
        return File.Exists(path) ? path : path;
    }

    private static string ResolveApiContentRoot()
    {
        var current = Directory.GetCurrentDirectory();
        var candidates = new[]
        {
            current,
            Path.Combine(current, "Fish.Api"),
            Path.Combine(current, "..", "Fish.Api"),
        };
        foreach (var candidate in candidates)
        {
            var full = Path.GetFullPath(candidate);
            if (File.Exists(Path.Combine(full, "appsettings.json")))
            {
                return full;
            }
        }

        return current;
    }
}
