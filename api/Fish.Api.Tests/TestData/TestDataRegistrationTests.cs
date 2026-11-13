using Fish.Api.Services.TestData;
using Fish.Api.Tests.Support;
using Microsoft.Extensions.Hosting;

namespace Fish.Api.Tests.TestData;

public sealed class TestDataRegistrationTests : IDisposable
{
    private const string EnvName = "FISH_API_UNITTEST_ISENABLED_KEY";
    private readonly string? _previous;

    public TestDataRegistrationTests()
    {
        _previous = Environment.GetEnvironmentVariable(EnvName);
        Environment.SetEnvironmentVariable(EnvName, null);
    }

    public void Dispose() => Environment.SetEnvironmentVariable(EnvName, _previous);

    [Fact]
    public void IsEnabled_FlagOff_ReturnsFalse()
    {
        Environment.SetEnvironmentVariable(EnvName, "present");
        var options = EnabledOptions();
        options.Enabled = false;

        Assert.False(TestDataRegistration.IsEnabled(options, Env("Test")));
    }

    [Fact]
    public void IsEnabled_ProductionWithFlagOn_Throws()
    {
        var options = EnabledOptions();

        var error = Assert.Throws<InvalidOperationException>(
            () => TestDataRegistration.IsEnabled(options, Env("Production")));
        Assert.Contains("Production", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void IsEnabled_EnvironmentNotAllowed_ReturnsFalse()
    {
        Environment.SetEnvironmentVariable(EnvName, "present");
        var options = EnabledOptions();
        options.AllowedEnvironments = ["Test"];

        Assert.False(TestDataRegistration.IsEnabled(options, Env("Staging")));
    }

    [Fact]
    public void IsEnabled_KeyEnvVarMissing_ReturnsFalse()
    {
        Environment.SetEnvironmentVariable(EnvName, null);
        var options = EnabledOptions();

        Assert.False(TestDataRegistration.IsEnabled(options, Env("Test")));
    }

    [Fact]
    public void IsEnabled_TestOrDevelopment_WithKey_ReturnsTrue()
    {
        Environment.SetEnvironmentVariable(EnvName, "present");
        var options = EnabledOptions();

        Assert.True(TestDataRegistration.IsEnabled(options, Env("Test")));
        Assert.True(TestDataRegistration.IsEnabled(options, Env("Development")));
    }

    [Fact]
    public void IsEnabled_ProductionWithFlagOff_ReturnsFalse()
    {
        var options = EnabledOptions();
        options.Enabled = false;

        Assert.False(TestDataRegistration.IsEnabled(options, Env("Production")));
    }

    private static TestDataOptions EnabledOptions() => new()
    {
        Enabled = true,
        AllowedEnvironments = ["Development", "Test", "E2E"],
        KeyEnvVar = EnvName,
        RequiredDatabase = "fish_test",
    };

    private static IHostEnvironment Env(string name) => new FakeHostEnvironment { EnvironmentName = name };
}
