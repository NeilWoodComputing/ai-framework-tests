using System.Text.Json;
using System.Text.RegularExpressions;

namespace Fish.Api.Tests;

public sealed class CommittedConfigurationTests
{
    [Fact]
    public void CommittedConfiguration_HasNoSecretsOrEnvFiles()
    {
        var apiRoot = TestPath.FindApiRoot();
        var envFiles = Directory.GetFiles(apiRoot, ".env*", SearchOption.AllDirectories)
            .Where(p => !p.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal)
                        && !p.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
            .ToList();
        Assert.True(envFiles.Count == 0, "No .env files should be committed: " + string.Join(", ", envFiles));

        foreach (var file in Directory.GetFiles(apiRoot, "appsettings*.json", SearchOption.AllDirectories)
                     .Where(p => !p.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal)
                                 && !p.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal)))
        {
            var json = File.ReadAllText(file);
            Assert.False(json.Length > 0 && json[0] == '\uFEFF', $"{file} must not have a UTF-8 BOM.");
            using var doc = JsonDocument.Parse(json);
            AssertNoSecretValues(doc.RootElement, Path.GetRelativePath(apiRoot, file), "$");
        }

        var appsettings = JsonDocument.Parse(File.ReadAllText(Path.Combine(apiRoot, "Fish.Api", "appsettings.json")));
        Assert.Equal(string.Empty, appsettings.RootElement.GetProperty("ConnectionStrings").GetProperty("FishConnection").GetString());
        Assert.False(appsettings.RootElement.TryGetProperty("TestData", out _), "appsettings.json must not contain a TestData section.");

        var production = JsonDocument.Parse(File.ReadAllText(Path.Combine(apiRoot, "Fish.Api", "appsettings.Production.json")));
        Assert.False(production.RootElement.GetProperty("TestData").GetProperty("Enabled").GetBoolean());
    }

    private static void AssertNoSecretValues(JsonElement element, string file, string path)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var child = $"{path}.{property.Name}";
                    if (IsSecretName(property.Name) && property.Value.ValueKind == JsonValueKind.String)
                    {
                        var value = property.Value.GetString() ?? string.Empty;
                        Assert.True(
                            IsAllowedSecretPlaceholder(value),
                            $"{file} {child} must be empty or an environment-variable placeholder, not a secret value.");
                    }

                    AssertNoSecretValues(property.Value, file, child);
                }

                break;
            case JsonValueKind.Array:
                var i = 0;
                foreach (var item in element.EnumerateArray())
                {
                    AssertNoSecretValues(item, file, $"{path}[{i}]");
                    i++;
                }

                break;
            case JsonValueKind.String:
                var text = element.GetString() ?? string.Empty;
                Assert.DoesNotContain("Password=", text, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain("Pwd=", text, StringComparison.OrdinalIgnoreCase);
                break;
        }
    }

    private static bool IsSecretName(string name) =>
        name.Contains("Connection", StringComparison.OrdinalIgnoreCase)
        || name.Contains("Password", StringComparison.OrdinalIgnoreCase)
        || name.Contains("Secret", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Key", StringComparison.OrdinalIgnoreCase);

    private static bool IsAllowedSecretPlaceholder(string value) =>
        string.IsNullOrEmpty(value)
        || Regex.IsMatch(value, @"^(\$\{[^}]+\})|(%[^%]+%)|(\$\([^)]+\))|(<[^>]+>)$");
}

internal static class TestPath
{
    public static string FindApiRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "Fish.Api.sln");
            var fromTests = Path.Combine(dir.FullName, "Fish.Api", "Fish.Api.csproj");
            if (File.Exists(candidate) || File.Exists(fromTests))
            {
                return dir.FullName;
            }

            // Climb from bin/Debug/net10.0 of the test project.
            if (File.Exists(Path.Combine(dir.FullName, "Fish.Api.Tests.csproj")))
            {
                return dir.Parent?.FullName ?? dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate the api/ folder from the test output directory.");
    }
}
