namespace Fish.Api.Services.TestData;

public static class SeedUnitOrder
{
    public static IReadOnlyList<ITestSeedUnit> Sort(IEnumerable<ITestSeedUnit> units)
    {
        ArgumentNullException.ThrowIfNull(units);
        var list = units.ToList();
        var byKey = new Dictionary<string, ITestSeedUnit>(StringComparer.Ordinal);
        foreach (var unit in list)
        {
            if (!byKey.TryAdd(unit.Key, unit))
            {
                throw new InvalidOperationException($"Duplicate seed unit key '{unit.Key}'.");
            }
        }

        foreach (var unit in list)
        {
            foreach (var dep in unit.DependsOn)
            {
                if (!byKey.ContainsKey(dep))
                {
                    throw new InvalidOperationException(
                        $"Seed unit '{unit.Key}' depends on missing '{dep}'.");
                }
            }
        }

        var result = new List<ITestSeedUnit>();
        var visiting = new HashSet<string>(StringComparer.Ordinal);
        var done = new HashSet<string>(StringComparer.Ordinal);

        void Visit(ITestSeedUnit unit)
        {
            if (done.Contains(unit.Key))
            {
                return;
            }

            if (!visiting.Add(unit.Key))
            {
                throw new InvalidOperationException(
                    $"Seed unit dependency cycle involving '{unit.Key}'.");
            }

            foreach (var dep in unit.DependsOn.OrderBy(k => k, StringComparer.Ordinal))
            {
                Visit(byKey[dep]);
            }

            visiting.Remove(unit.Key);
            done.Add(unit.Key);
            result.Add(unit);
        }

        foreach (var unit in list.OrderBy(u => u.Key, StringComparer.Ordinal))
        {
            Visit(unit);
        }

        return result;
    }
}
