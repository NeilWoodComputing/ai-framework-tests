using Fish.Api.Services.TestData;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Fish.Api.Tests.Support;

public sealed class FishApiFactory : WebApplicationFactory<Program>
{
    public const string TestKeyEnvVar = "FISH_API_UNITTEST_DATA_KEY";
    public const string TestKeyValue = "unit-test-key-not-a-secret";

    private readonly string _environment;
    private readonly bool _enableTestData;
    private readonly Dictionary<string, string?> _extra;

    public FishApiFactory(
        string environment,
        bool enableTestData,
        Dictionary<string, string?>? extra = null)
    {
        _environment = environment;
        _enableTestData = enableTestData;
        _extra = extra ?? new Dictionary<string, string?>();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(_environment);

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(BuildConfigValues());
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ITestDataService>();
            services.AddSingleton<ITestDataService, FakeTestDataService>();
        });
    }

    /// <summary>
    /// Host configuration is visible to <c>WebApplication.CreateBuilder</c>
    /// immediately, so factory values (including <c>TestData:Key</c>) are
    /// available without mutating the process environment.
    /// </summary>
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            config.AddInMemoryCollection(BuildConfigValues());
        });
        return base.CreateHost(builder);
    }

    private Dictionary<string, string?> BuildConfigValues()
    {
        var values = new Dictionary<string, string?>
        {
            ["ConnectionStrings:FishConnection"] = "Host=127.0.0.1;Database=fish_test;Username=unused",
            ["InitialisationSettings:MigrateDatabase"] = "false",
            ["TestData:StartupSeed"] = "false",
            ["TestData:KeyEnvVar"] = TestKeyEnvVar,
        };

        if (_enableTestData)
        {
            values["TestData:Enabled"] = "true";
            values["TestData:AllowMasterReset"] = "true";
            values["TestData:AllowedEnvironments:0"] = "Development";
            values["TestData:AllowedEnvironments:1"] = "Test";
            values["TestData:AllowedEnvironments:2"] = "E2E";
            values["TestData:RequiredDatabase"] = "fish_test";
            values["TestData:Key"] = TestKeyValue;
        }
        else
        {
            values["TestData:Enabled"] = "false";
        }

        foreach (var (key, value) in _extra)
        {
            values[key] = value;
        }

        return values;
    }
}
