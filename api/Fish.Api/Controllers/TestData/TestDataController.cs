using Fish.Api.Services.TestData;
using Microsoft.AspNetCore.Mvc;

namespace Fish.Api.Controllers.TestData;

/// <summary>
/// Test-data reset endpoints. Registered only when <see cref="TestDataRegistration.IsEnabled"/>
/// is true; otherwise the controller is removed from application parts and these
/// routes return 404. This test app has no sign-in: access is the
/// <c>X-Test-Data-Key</c> header plus the environment / database guards.
/// </summary>
[ApiController]
[Route("TestData")]
[ServiceFilter(typeof(TestDataAccessFilter))]
public sealed class TestDataController(ITestDataService service) : ControllerBase
{
    [HttpPost("Reset/master")]
    public async Task<IActionResult> ResetMaster(CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.ResetMasterAsync(cancellationToken);
            return Ok(result);
        }
        catch (TestDataConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (TestDataDisabledException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("Reset/{scenarioKey}")]
    public async Task<IActionResult> Reset(string scenarioKey, CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.ResetBatchAsync(scenarioKey, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (TestDataConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
