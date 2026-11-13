using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Fish.Api.Tests.Support;

internal sealed class FakeHostEnvironment : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Test";
    public string ApplicationName { get; set; } = "Fish.Api";
    public string ContentRootPath { get; set; } = ".";
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}
