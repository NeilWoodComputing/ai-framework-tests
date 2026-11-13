using Fish.Api.Services.TestData;

namespace Fish.Api.Tests.Support;

internal sealed class FakeTestDataService : ITestDataService
{
    public Task StartupSeedAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task<TestDataMasterResetResult> ResetMasterAsync(CancellationToken cancellationToken) =>
        Task.FromResult(new TestDataMasterResetResult(
            "master",
            0,
            ["baseline.migration-seed"],
            new Dictionary<string, int>()));

    public Task<TestDataBatchResetResult?> ResetBatchAsync(string scenarioKey, CancellationToken cancellationToken)
    {
        if (string.Equals(scenarioKey, "missing.batch.state", StringComparison.Ordinal))
        {
            return Task.FromResult<TestDataBatchResetResult?>(null);
        }

        return Task.FromResult<TestDataBatchResetResult?>(
            new TestDataBatchResetResult(scenarioKey, new Dictionary<string, Guid>()));
    }
}
