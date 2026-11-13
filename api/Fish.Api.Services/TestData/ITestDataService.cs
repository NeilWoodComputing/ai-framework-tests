namespace Fish.Api.Services.TestData;

public interface ITestDataService
{
    Task StartupSeedAsync(CancellationToken cancellationToken);

    Task<TestDataMasterResetResult> ResetMasterAsync(CancellationToken cancellationToken);

    Task<TestDataBatchResetResult?> ResetBatchAsync(string scenarioKey, CancellationToken cancellationToken);
}

public sealed record TestDataMasterResetResult(
    string Scenario,
    int TruncatedTables,
    IReadOnlyList<string> Units,
    IReadOnlyDictionary<string, int> SeedRows);

public sealed record TestDataBatchResetResult(
    string Scenario,
    IReadOnlyDictionary<string, Guid> Ids);
