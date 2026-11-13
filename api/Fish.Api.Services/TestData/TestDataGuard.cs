using Fish.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Fish.Api.Services.TestData;

public sealed class TestDataGuard(FishDbContext db, IOptions<TestDataOptions> options)
{
    public void EnsureTestDatabase()
    {
        var databaseName = db.Database.GetDbConnection().Database;
        EnsureTestDatabase(db.Database.ProviderName, databaseName);
    }

    internal void EnsureTestDatabase(string? providerName, string? databaseName)
    {
        if (!string.Equals(providerName, TestDataRegistration.NpgsqlProviderName, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("TestData refused: not PostgreSQL.");
        }

        var required = options.Value.RequiredDatabase;
        if (string.IsNullOrWhiteSpace(required))
        {
            throw new InvalidOperationException("TestData refused: RequiredDatabase is not configured.");
        }

        if (!string.Equals(databaseName, required, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("TestData refused: not the named test database.");
        }
    }
}
