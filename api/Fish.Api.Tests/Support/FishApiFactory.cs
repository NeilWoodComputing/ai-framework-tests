using Fish.Api.Services.TestData;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Fish.Api.Tests.Support;

public sealed class FishApiFactory : WebApplicationFactory<Program>
{
    public const string TestKeyEnvVar = "FISH_API_UNITTEST_DATA_KEY";
    public const string TestKeyValue = "unit-test-key-not-a-secret";

    private readonly string _environment;
    private readonly bool _enableTestData;
    private readonly Dictionary<string, string?> _extra;
    private string? _previousKey;
    private bool _keyTouched;

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

        if (_enableTestData)
        {
            _previousKey = Environment.GetEnvironmentVariable(TestKeyEnvVar);
            Environment.SetEnvironmentVariable(TestKeyEnvVar, TestKeyValue);
            _keyTouched = true;
        }

        builder.ConfigureAppConfiguration((_, config) =>
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
            }
            else
            {
                values["TestData:Enabled"] = "false";
            }

            foreach (var (key, value) in _extra)
            {
                values[key] = value;
            }

            config.AddInMemoryCollection(values);
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ITestDataService>();
            services.AddSingleton<ITestDataService, FakeTestDataService>();
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (_keyTouched)
        {
            Environment.SetEnvironmentVariable(TestKeyEnvVar, _previousKey);
            _keyTouched = false;
        }

        base.Dispose(disposing);
    }
}
