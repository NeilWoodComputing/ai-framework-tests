using Fish.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Fish.Api.Services.TestData;

/// <summary>
/// Recreates every <c>HasData</c> row from the current EF model. This scaffold
/// has no seed rows yet; later tickets add entities and this unit stays
/// model-driven.
/// </summary>
public sealed class MigrationSeedUnit : TestSeedUnitBase
{
    public const string UnitKey = "baseline.migration-seed";

    public override string Key => UnitKey;

    public override Task<IReadOnlyDictionary<string, Guid>> SeedAsync(
        FishDbContext db,
        string? state,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        // Touch GetSeedData so a later HasData addition is already on this path.
        // There is nothing to insert until T-FISH-001 (or later) adds seed rows.
        foreach (var entity in PrincipalsFirst(db.Model.GetEntityTypes()))
        {
            _ = entity.GetSeedData(providerValues: true).Count();
        }

        return Task.FromResult<IReadOnlyDictionary<string, Guid>>(new Dictionary<string, Guid>());
    }

    internal static IReadOnlyList<IEntityType> PrincipalsFirst(IEnumerable<IEntityType> all)
    {
        var list = all.Where(e => e.GetTableName() is not null)
            .OrderBy(e => e.Name, StringComparer.Ordinal)
            .ToList();
        var done = new HashSet<IEntityType>();
        var result = new List<IEntityType>(list.Count);

        while (done.Count < list.Count)
        {
            var next = list.FirstOrDefault(e =>
                !done.Contains(e)
                && e.GetForeignKeys().All(fk =>
                    fk.PrincipalEntityType == e || done.Contains(fk.PrincipalEntityType)));
            if (next is null)
            {
                throw new InvalidOperationException(
                    "Cannot order seed entities: a foreign-key cycle was found.");
            }

            done.Add(next);
            result.Add(next);
        }

        return result;
    }
}
