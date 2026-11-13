using Fish.Api.Data;
using Microsoft.EntityFrameworkCore;
using Fish.Api.Services.TestData;

namespace Fish.Api.Tests.TestData;

public sealed class SeedUnitOrderTests
{
    [Fact]
    public void Sort_PutsDependenciesFirstAndIsStable()
    {
        var a = new StubUnit("a");
        var b = new StubUnit("b", dependsOn: ["a"]);
        var c = new StubUnit("c", dependsOn: ["a"]);
        var ordered = SeedUnitOrder.Sort([c, b, a]);

        Assert.Equal(["a", "b", "c"], ordered.Select(u => u.Key).ToArray());
    }

    [Fact]
    public void Sort_Cycle_Throws()
    {
        var a = new StubUnit("a", dependsOn: ["b"]);
        var b = new StubUnit("b", dependsOn: ["a"]);

        var error = Assert.Throws<InvalidOperationException>(() => SeedUnitOrder.Sort([a, b]));
        Assert.Contains("cycle", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Sort_MissingDependency_Throws()
    {
        var a = new StubUnit("a", dependsOn: ["missing"]);

        var error = Assert.Throws<InvalidOperationException>(() => SeedUnitOrder.Sort([a]));
        Assert.Contains("missing", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void GetTruncatableTables_IsModelTablesOnly()
    {
        var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<FishDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        using var db = new FishDbContext(options);
        var tables = TestDataService.GetTruncatableTables(db.Model);

        Assert.Empty(tables);
        Assert.DoesNotContain(
            tables,
            t => t.Contains(FishDbContext.MigrationsHistoryTable, StringComparison.Ordinal));
    }

    private sealed class StubUnit(string key, IReadOnlyCollection<string>? dependsOn = null) : TestSeedUnitBase
    {
        public override string Key { get; } = key;
        public override IReadOnlyCollection<string> DependsOn { get; } = dependsOn ?? [];

        public override Task<IReadOnlyDictionary<string, Guid>> SeedAsync(
            FishDbContext db,
            string? state,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyDictionary<string, Guid>>(new Dictionary<string, Guid>());
    }
}
