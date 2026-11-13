namespace Fish.Api.Services.TestData;

/// <summary>
/// Options for the test-data reset module. The section is absent from
/// <c>appsettings.json</c>. Production forces <see cref="Enabled"/> to false.
/// <see cref="KeyEnvVar"/> is an environment variable NAME, never a value.
/// </summary>
public sealed class TestDataOptions
{
    public const string SectionName = "TestData";
    public const string DefaultKeyEnvVar = "E2E_TEST_DATA_KEY";

    public bool Enabled { get; set; }

    public bool AllowMasterReset { get; set; }

    public string[] AllowedEnvironments { get; set; } = [];

    public string RequiredDatabase { get; set; } = "";

    public string KeyEnvVar { get; set; } = DefaultKeyEnvVar;

    public bool StartupSeed { get; set; } = true;
}
