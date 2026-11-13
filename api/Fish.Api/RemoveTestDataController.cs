using System.Reflection;
using Fish.Api.Controllers.TestData;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Fish.Api;

/// <summary>
/// Removes <see cref="TestDataController"/> from application parts so the
/// routes are unavailable (404) when test data is not enabled.
/// </summary>
public sealed class RemoveTestDataController : IApplicationFeatureProvider<ControllerFeature>
{
    public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
    {
        var type = typeof(TestDataController).GetTypeInfo();
        feature.Controllers.Remove(type);
    }
}
