using System.Net;
using System.Text.Json;
using Fish.Api.Services.TestData;
using Fish.Api.Tests.Support;

namespace Fish.Api.Tests.TestData;

public sealed class ResetEndpointTests
{
    [Theory]
    [InlineData("Development")]
    [InlineData("Test")]
    public async Task ResetMaster_Succeeds_InTestAndDevelopment(string environment)
    {
        await using var factory = new FishApiFactory(environment, enableTestData: true);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestDataAccessFilter.KeyHeaderName, FishApiFactory.TestKeyValue);

        var response = await client.PostAsync("/TestData/Reset/master", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync();
        var body = await JsonSerializer.DeserializeAsync<JsonElement>(stream);
        Assert.Equal("master", body.GetProperty("scenario").GetString());
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("Test")]
    public async Task ResetMaster_Forbidden_WhenKeyIsWrong(string environment)
    {
        await using var factory = new FishApiFactory(environment, enableTestData: true);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestDataAccessFilter.KeyHeaderName, "wrong-key");

        var response = await client.PostAsync("/TestData/Reset/master", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ResetMaster_Unavailable_InProduction()
    {
        await using var factory = new FishApiFactory("Production", enableTestData: false);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestDataAccessFilter.KeyHeaderName, FishApiFactory.TestKeyValue);

        var response = await client.PostAsync("/TestData/Reset/master", content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
