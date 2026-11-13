using Fish.Api.Data;

namespace Fish.Api.Services.TestData;

/// <summary>
/// One named, idempotent seed unit. Features register their own units
/// (T-FISH-001 and later) by adding another <see cref="ITestSeedUnit"/>
/// registration; this scaffold ships the baseline migration-seed hook only.
/// </summary>
public interface ITestSeedUnit
{
    string Key { get; }

    IReadOnlyCollection<string> DependsOn { get; }

    IReadOnlyCollection<string> States { get; }

    string? DefaultState { get; }

    Task ClearAsync(FishDbContext db, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<string, Guid>> SeedAsync(
        FishDbContext db,
        string? state,
        CancellationToken cancellationToken);
}

public abstract class TestSeedUnitBase : ITestSeedUnit
{
    public abstract string Key { get; }

    public virtual IReadOnlyCollection<string> DependsOn => [];

    public virtual IReadOnlyCollection<string> States => [];

    public virtual string? DefaultState => null;

    public virtual Task ClearAsync(FishDbContext db, CancellationToken cancellationToken) =>
        Task.CompletedTask;

    public abstract Task<IReadOnlyDictionary<string, Guid>> SeedAsync(
        FishDbContext db,
        string? state,
        CancellationToken cancellationToken);
}
