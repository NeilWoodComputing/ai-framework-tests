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
        var options = EnabledOptions();
        options.AllowedEnvironments = ["Test"];

        Assert.False(TestDataRegistration.IsEnabled(options, Env("Staging")));
    }

    [Fact]
    public void IsEnabled_DoesNotRequireProcessKey_ReturnsTrue()
    {
        Environment.SetEnvironmentVariable(EnvName, null);
        var options = EnabledOptions();

        Assert.True(TestDataRegistration.IsEnabled(options, Env("Test")));
    }

    [Fact]
    public void IsEnabled_TestOrDevelopment_ReturnsTrue()
    {
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

    [Fact]
    public void ResolveKey_PrefersOptionsKey_OverEnvironment()
    {
        Environment.SetEnvironmentVariable(EnvName, "from-environment");
        var options = EnabledOptions();
        options.Key = "from-configuration";

        Assert.Equal("from-configuration", TestDataRegistration.ResolveKey(options));
    }

    [Fact]
    public void ResolveKey_FallsBackToEnvironment()
    {
        Environment.SetEnvironmentVariable(EnvName, "from-environment");
        var options = EnabledOptions();

        Assert.Equal("from-environment", TestDataRegistration.ResolveKey(options));
    }

    [Fact]
    public void ResolveKey_MissingBoth_ReturnsNull()
    {
        Environment.SetEnvironmentVariable(EnvName, null);
        var options = EnabledOptions();

        Assert.Null(TestDataRegistration.ResolveKey(options));
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
