using Fish.Api.Data;

namespace Fish.Api.Tests;

public sealed class SnakeCaseTests
{
    [Theory]
    [InlineData("Id", "id")]
    [InlineData("HasFins", "has_fins")]
    [InlineData("HasBigLips", "has_big_lips")]
    [InlineData("CreatedUtc", "created_utc")]
    public void ToSnakeCase_FollowsFrameworkConvention(string input, string expected)
    {
        Assert.Equal(expected, FishDbContext.ToSnakeCase(input));
    }
}
