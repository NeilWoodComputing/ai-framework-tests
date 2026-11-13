using System.Net;
using Fish.Api.Tests.Support;

namespace Fish.Api.Tests;

public sealed class HealthCheckTests
{
    [Theory]
    [InlineData("Development", true)]
    [InlineData("Test", true)]
    [InlineData("Production", false)]
    public async Task Health_Returns200_WhenTheApiIsRunning(string environment, bool enableTestData)
    {
        await using var factory = new FishApiFactory(environment, enableTestData);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
