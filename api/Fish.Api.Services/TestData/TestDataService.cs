using Fish.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Fish.Api.Services.TestData;

public sealed class TestDataService(
    FishDbContext db,
    TestDataGuard guard,
    IEnumerable<ITestSeedUnit> units,
    IOptions<TestDataOptions> options,
    ILogger<TestDataService> logger) : ITestDataService
{
    internal IReadOnlyList<ITestSeedUnit> Ordered => SeedUnitOrder.Sort(units);

    public async Task StartupSeedAsync(CancellationToken cancellationToken)
    {
        guard.EnsureTestDatabase();
        foreach (var unit in Ordered.Where(u => u.DefaultState is null && u.States.Count == 0))
        {
            await unit.SeedAsync(db, null, cancellationToken);
        }
    }

    public async Task<TestDataMasterResetResult> ResetMasterAsync(CancellationToken cancellationToken)
    {
        if (!options.Value.AllowMasterReset)
        {
            throw new TestDataDisabledException("Master reset is not allowed.");
        }

        guard.EnsureTestDatabase();

        var pending = (await db.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();
        if (pending.Count > 0)
        {
            throw new TestDataConflictException("Apply migrations first.");
        }

        var tables = GetTruncatableTables(db.Model);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        if (tables.Count > 0)
        {
            var sql = $"TRUNCATE TABLE {string.Join(", ", tables)} RESTART IDENTITY CASCADE";
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }

        var ran = new List<string>();
        foreach (var unit in Ordered)
        {
            await unit.SeedAsync(db, unit.DefaultState, cancellationToken);
            ran.Add(unit.DefaultState is null ? unit.Key : $"{unit.Key}.{unit.DefaultState}");
        }

        var seedRows = db.Model.GetEntityTypes()
            .Where(e => e.GetTableName() is not null && e.GetSeedData().Any())
            .ToDictionary(e => e.GetTableName()!, e => e.GetSeedData().Count(), StringComparer.Ordinal);

        await tx.CommitAsync(cancellationToken);
        logger.LogWarning("TestData master reset: {Tables} tables truncated; units {Units}", tables.Count, ran);
        return new TestDataMasterResetResult("master", tables.Count, ran, seedRows);
    }

    public async Task<TestDataBatchResetResult?> ResetBatchAsync(string scenarioKey, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(scenarioKey);

        var dot = scenarioKey.LastIndexOf('.');
        if (dot <= 0)
        {
            return null;
        }

        var batchKey = scenarioKey[..dot];
        var stateName = scenarioKey[(dot + 1)..];
        var batch = units.SingleOrDefault(u => u.Key == batchKey && u.States.Contains(stateName));
        if (batch is null)
        {
            return null;
        }

        guard.EnsureTestDatabase();

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        await batch.ClearAsync(db, cancellationToken);
        foreach (var dep in batch.DependsOn)
        {
            await units.Single(u => u.Key == dep).SeedAsync(db, null, cancellationToken);
        }

        var ids = await batch.SeedAsync(db, stateName, cancellationToken);
        await tx.CommitAsync(cancellationToken);
        logger.LogInformation("TestData reset {Key}", scenarioKey);
        return new TestDataBatchResetResult(scenarioKey, ids);
    }

    /// <summary>
    /// Quoted <c>schema.table</c> identifiers taken from the EF model only.
    /// The migrations history table is not in the model and is never included.
    /// </summary>
    internal static IReadOnlyList<string> GetTruncatableTables(IModel model)
    {
        var tables = new SortedSet<string>(StringComparer.Ordinal);
        foreach (var entity in model.GetEntityTypes())
        {
            var table = entity.GetTableName();
            if (string.IsNullOrEmpty(table)
                || string.Equals(table, FishDbContext.MigrationsHistoryTable, StringComparison.Ordinal))
            {
                continue;
            }

            var schema = entity.GetSchema() ?? FishDbContext.MigrationsSchema;
            tables.Add($"{Quote(schema)}.{Quote(table)}");
        }

        return tables.ToList();
    }

    private static string Quote(string identifier)
    {
        if (identifier.Any(c => !char.IsLetterOrDigit(c) && c != '_'))
        {
            throw new InvalidOperationException("TestData refused: unexpected identifier in the EF model.");
        }

        return $"\"{identifier}\"";
    }
}
