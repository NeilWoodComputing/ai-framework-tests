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
        Environment.SetEnvironmentVariable(EnvName, "expected-key");
    }

    public void Dispose() => Environment.SetEnvironmentVariable(EnvName, _previous);

    [Fact]
    public void OnAuthorization_WrongKey_Returns403()
    {
        var context = Authorize("wrong-key");
        Assert.IsType<StatusCodeResult>(context.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, ((StatusCodeResult)context.Result!).StatusCode);
    }

    [Fact]
    public void OnAuthorization_MissingKey_Returns403()
    {
        var context = Authorize(null);
        Assert.Equal(StatusCodes.Status403Forbidden, ((StatusCodeResult)context.Result!).StatusCode);
    }

    [Fact]
    public void OnAuthorization_MatchingKey_Allows()
    {
        var context = Authorize("expected-key");
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

    private static AuthorizationFilterContext Authorize(string? givenKey)
    {
        var http = new DefaultHttpContext();
        if (givenKey is not null)
        {
            http.Request.Headers[TestDataAccessFilter.KeyHeaderName] = givenKey;
        }

        var actionContext = new ActionContext(http, new RouteData(), new ActionDescriptor());
        var context = new AuthorizationFilterContext(actionContext, []);
        var filter = new TestDataAccessFilter(Options.Create(new TestDataOptions { KeyEnvVar = EnvName }));
        filter.OnAuthorization(context);
        return context;
    }
}
