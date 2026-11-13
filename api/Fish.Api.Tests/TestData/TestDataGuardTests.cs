using Fish.Api.Data;
using Fish.Api.Services.TestData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Fish.Api.Tests.TestData;

public sealed class TestDataGuardTests
{
    [Fact]
    public void EnsureTestDatabase_NotNpgsql_Throws()
    {
        var guard = CreateGuard("fish_test");

        var error = Assert.Throws<InvalidOperationException>(
            () => guard.EnsureTestDatabase("Microsoft.EntityFrameworkCore.InMemory", "fish_test"));
        Assert.Contains("not PostgreSQL", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void EnsureTestDatabase_OtherDatabaseName_Throws()
    {
        var guard = CreateGuard("fish_test");

        var error = Assert.Throws<InvalidOperationException>(
            () => guard.EnsureTestDatabase(TestDataRegistration.NpgsqlProviderName, "some_other_db"));
        Assert.Contains("not the named test database", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void EnsureTestDatabase_RequiredNameMissing_Throws()
    {
        var guard = CreateGuard("");

        var error = Assert.Throws<InvalidOperationException>(
            () => guard.EnsureTestDatabase(TestDataRegistration.NpgsqlProviderName, "fish_test"));
        Assert.Contains("RequiredDatabase", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void EnsureTestDatabase_MatchingNpgsql_DoesNotThrow()
    {
        var guard = CreateGuard("fish_test");
        guard.EnsureTestDatabase(TestDataRegistration.NpgsqlProviderName, "fish_test");
    }

    [Fact]
    public void EnsureTestDatabase_InMemoryContext_Throws()
    {
        var options = new DbContextOptionsBuilder<FishDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        using var db = new FishDbContext(options);
        var guard = new TestDataGuard(db, Options.Create(new TestDataOptions { RequiredDatabase = "fish_test" }));

        Assert.Throws<InvalidOperationException>(() => guard.EnsureTestDatabase());
    }

    private static TestDataGuard CreateGuard(string requiredDatabase)
    {
        var options = new DbContextOptionsBuilder<FishDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        var db = new FishDbContext(options);
        return new TestDataGuard(db, Options.Create(new TestDataOptions { RequiredDatabase = requiredDatabase }));
    }
}
