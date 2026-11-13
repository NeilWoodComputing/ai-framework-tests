using Microsoft.EntityFrameworkCore;

namespace Fish.Api.Data;

/// <summary>
/// Application EF Core context. This scaffold has no domain entities yet
/// (Fish persistence is T-FISH-001). Conventions follow API.Framework:
/// PostgreSQL via Npgsql, explicit names, and snake_case columns when
/// entities are added.
/// </summary>
public sealed class FishDbContext(DbContextOptions<FishDbContext> options) : DbContext(options)
{
    /// <summary>
    /// Schema used for the EF migrations history table. Domain table schemas
    /// are a later plan decision (T-FISH-001); this scaffold does not invent one.
    /// </summary>
    public const string MigrationsSchema = "public";

    public const string MigrationsHistoryTable = "__ef_migrations_history";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ApplySnakeCaseColumns(modelBuilder);
    }

    /// <summary>
    /// API.Framework convention: column names are snake_case. Table names and
    /// explicit key / index names are set per entity when tables are added.
    /// </summary>
    internal static void ApplySnakeCaseColumns(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                if (property.GetColumnName() == property.Name)
                {
                    property.SetColumnName(ToSnakeCase(property.Name));
                }
            }
        }
    }

    internal static string ToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name))
        {
            return name;
        }

        var chars = new List<char>(name.Length + 4);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c))
            {
                if (i > 0
                    && (char.IsLower(name[i - 1])
                        || (i + 1 < name.Length && char.IsLower(name[i + 1]))))
                {
                    chars.Add('_');
                }

                chars.Add(char.ToLowerInvariant(c));
            }
            else
            {
                chars.Add(c);
            }
        }

        return new string(chars.ToArray());
    }
}
