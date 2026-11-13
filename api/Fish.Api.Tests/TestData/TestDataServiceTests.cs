using Fish.Api.Data;
using Fish.Api.Services.TestData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Fish.Api.Tests.TestData;

public sealed class TestDataServiceTests
{
    [Fact]
    public async Task ResetMaster_AllowMasterResetOff_Throws()
    {
        var service = CreateService(allowMaster: false);
        var error = await Assert.ThrowsAsync<TestDataDisabledException>(
            () => service.ResetMasterAsync(CancellationToken.None));
        Assert.Contains("not allowed", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResetBatch_UnknownKey_ReturnsNull()
    {
        var service = CreateService(allowMaster: true);
        Assert.Null(await service.ResetBatchAsync("unknown.key", CancellationToken.None));
        Assert.Null(await service.ResetBatchAsync("noperiod", CancellationToken.None));
    }

    [Fact]
    public async Task MigrationSeedUnit_InsertsNoRows_OnEmptyModel()
    {
        var options = new DbContextOptionsBuilder<FishDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        using var db = new FishDbContext(options);
        var unit = new MigrationSeedUnit();

        var ids = await unit.SeedAsync(db, null, CancellationToken.None);
        Assert.Empty(ids);
        Assert.Empty(db.Model.GetEntityTypes().SelectMany(e => e.GetSeedData()));
    }

    private static TestDataService CreateService(bool allowMaster)
    {
        var options = new DbContextOptionsBuilder<FishDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        var db = new FishDbContext(options);
        var testOptions = Options.Create(new TestDataOptions
        {
            AllowMasterReset = allowMaster,
            RequiredDatabase = "fish_test",
        });
        var guard = new TestDataGuard(db, testOptions);
        return new TestDataService(
            db,
            guard,
            [new MigrationSeedUnit()],
            testOptions,
            NullLogger<TestDataService>.Instance);
    }
}
