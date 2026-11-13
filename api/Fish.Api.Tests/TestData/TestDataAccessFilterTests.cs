using Fish.Api.Services.TestData;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;

namespace Fish.Api.Tests.TestData;

public sealed class TestDataAccessFilterTests : IDisposable
{
    private const string EnvName = "FISH_API_UNITTEST_FILTER_KEY";
    private readonly string? _previous;

    public TestDataAccessFilterTests()
    {
        _previous = Environment.GetEnvironmentVariable(EnvName);
        Environment.SetEnvironmentVariable(EnvName, null);
    }

    public void Dispose() => Environment.SetEnvironmentVariable(EnvName, _previous);

    [Fact]
    public void OnAuthorization_WrongKey_Returns403()
    {
        var context = Authorize("wrong-key", new TestDataOptions { Key = "expected-key" });
        Assert.IsType<StatusCodeResult>(context.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, ((StatusCodeResult)context.Result!).StatusCode);
    }

    [Fact]
    public void OnAuthorization_MissingHeader_Returns403()
    {
        var context = Authorize(null, new TestDataOptions { Key = "expected-key" });
        Assert.Equal(StatusCodes.Status403Forbidden, ((StatusCodeResult)context.Result!).StatusCode);
    }

    [Fact]
    public void OnAuthorization_MatchingKey_Allows()
    {
        var context = Authorize("expected-key", new TestDataOptions { Key = "expected-key" });
        Assert.Null(context.Result);
    }

    [Fact]
    public void OnAuthorization_NoKeyConfigured_Returns404()
    {
        var context = Authorize("any-key", new TestDataOptions { KeyEnvVar = EnvName });
        Assert.IsType<NotFoundResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_OptionsKeyPreferredOverEnvironment()
    {
        Environment.SetEnvironmentVariable(EnvName, "from-environment");
        var context = Authorize(
            "from-configuration",
            new TestDataOptions { Key = "from-configuration", KeyEnvVar = EnvName });
        Assert.Null(context.Result);

        var rejected = Authorize(
            "from-environment",
            new TestDataOptions { Key = "from-configuration", KeyEnvVar = EnvName });
        Assert.Equal(StatusCodes.Status403Forbidden, ((StatusCodeResult)rejected.Result!).StatusCode);
    }

    [Fact]
    public void OnAuthorization_FallsBackToEnvironmentVariable()
    {
        Environment.SetEnvironmentVariable(EnvName, "expected-key");
        var context = Authorize("expected-key", new TestDataOptions { KeyEnvVar = EnvName });
        Assert.Null(context.Result);
    }

    [Fact]
    public void KeysMatch_RejectsDifferentLengths()
    {
        Assert.False(TestDataAccessFilter.KeysMatch("abc", "ab"));
        Assert.False(TestDataAccessFilter.KeysMatch("", "abc"));
        Assert.False(TestDataAccessFilter.KeysMatch("abc", ""));
        Assert.True(TestDataAccessFilter.KeysMatch("abc", "abc"));
    }

    private static AuthorizationFilterContext Authorize(string? givenKey, TestDataOptions options)
    {
        var http = new DefaultHttpContext();
        if (givenKey is not null)
        {
            http.Request.Headers[TestDataAccessFilter.KeyHeaderName] = givenKey;
        }

        var actionContext = new ActionContext(http, new RouteData(), new ActionDescriptor());
        var context = new AuthorizationFilterContext(actionContext, []);
        var filter = new TestDataAccessFilter(Options.Create(options));
        filter.OnAuthorization(context);
        return context;
    }
}
