namespace Fish.Api.Tests;

public sealed class ReadmeTests
{
    [Fact]
    public void Readme_ExplainsRunTestAndConfig()
    {
        var apiRoot = TestPath.FindApiRoot();
        var readmePath = Path.Combine(apiRoot, "README.md");
        Assert.True(File.Exists(readmePath), "api/README.md must exist.");
        var text = File.ReadAllText(readmePath);

        Assert.Contains("dotnet run", text, StringComparison.Ordinal);
        Assert.Contains("dotnet test", text, StringComparison.Ordinal);
        Assert.Contains("dotnet build", text, StringComparison.Ordinal);
        Assert.Contains("FISH_TEST_ConnectionStrings__FishConnection", text, StringComparison.Ordinal);
        Assert.Contains("user-secrets", text, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ConnectionStrings:FishConnection", text, StringComparison.Ordinal);
        Assert.Contains("E2E_TEST_DATA_KEY", text, StringComparison.Ordinal);
        Assert.Contains("/health", text, StringComparison.Ordinal);
        Assert.Contains("TestData/Reset/master", text, StringComparison.Ordinal);
        Assert.Contains("Production", text, StringComparison.Ordinal);
        Assert.DoesNotContain("Password=", text, StringComparison.OrdinalIgnoreCase);
    }
}
