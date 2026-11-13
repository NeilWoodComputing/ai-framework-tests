using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Fish.Api.Services.TestData;

/// <summary>
/// Guards reset actions with a fixed-time compare of the
/// <c>X-Test-Data-Key</c> header against the environment variable named by
/// <see cref="TestDataOptions.KeyEnvVar"/>. This test app has no sign-in, so
/// there is no JWT / persona check (a documented deviation from the
/// API.Framework template's signed-in persona requirement).
/// </summary>
public sealed class TestDataAccessFilter(IOptions<TestDataOptions> options) : IAuthorizationFilter
{
    public const string KeyHeaderName = "X-Test-Data-Key";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var expected = Environment.GetEnvironmentVariable(options.Value.KeyEnvVar) ?? string.Empty;
        var given = context.HttpContext.Request.Headers[KeyHeaderName].ToString();

        if (!KeysMatch(expected, given))
        {
            // Never echo or log the key.
            context.Result = new StatusCodeResult(StatusCodes.Status403Forbidden);
        }
    }

    internal static bool KeysMatch(string expected, string given)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(given))
        {
            return false;
        }

        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var givenBytes = Encoding.UTF8.GetBytes(given);
        if (expectedBytes.Length != givenBytes.Length)
        {
            // Lengths must match for FixedTimeEquals; still do a compare
            // against a same-length buffer so the timing is not a simple
            // early-return on length alone for equal-length attempts.
            CryptographicOperations.FixedTimeEquals(expectedBytes, expectedBytes);
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(expectedBytes, givenBytes);
    }
}
