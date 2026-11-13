# Fish API

C# / .NET 10 API for the fish test app, in `api/`. It follows the [AI-framework](https://github.com/NeilWoodComputing/AI-framework) API.Framework principles: a host, services and data project, PostgreSQL with EF Core migrations (the framework default), a health check, and a test-only reset module with seed hooks.

This scaffold is empty of Fish columns and endpoints. Those arrive in T-FISH-001 and T-FISH-002. The app has no sign-in and no authentication.

## Prerequisites

- .NET SDK 10
- PostgreSQL, with two dedicated databases you create: `fish_dev` (Development) and `fish_test` (Test). Do not point this API at a shared or production database.
- The `dotnet-ef` tool, used only when adding migrations (a local tool manifest is in this folder).

## Configure

Committed `appsettings*.json` files hold **environment variable names and empty values only**. There are no passwords, connection strings or keys in the repository, and no `.env` files.

### Development

Set the connection string with user-secrets on the `Fish.Api` project (never commit the value):

```bash
cd api/Fish.Api
dotnet user-secrets set "ConnectionStrings:FishConnection" "<your-local-fish_dev-connection-string>"
```

The Development reset endpoint also needs the environment variable named `E2E_TEST_DATA_KEY` to be set in your shell or user environment. The value is a shared test key, not a login password. If that variable is missing, the reset controller is not registered.

Development applies migrations on startup (`InitialisationSettings:MigrateDatabase` is `true`). The design-time factory, used by `dotnet ef`, reads the same user-secrets. It has no fallback connection string.

### Test

When `ASPNETCORE_ENVIRONMENT=Test`, the host reads environment variables with the `FISH_TEST_` prefix (and strips it). Set:

| Purpose | Environment variable name |
|---------|---------------------------|
| Connection string | `FISH_TEST_ConnectionStrings__FishConnection` |
| Reset key | `E2E_TEST_DATA_KEY` (name configured as `TestData:KeyEnvVar`) |

The Test runtime does **not** apply migrations (`MigrateDatabase` is `false`). Apply migrations with a separate owner connection, then run the API. The runtime database user needs `USAGE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` and `TRUNCATE` only — not `DROP`, `CREATE` or `CREATEDB`.

The reset module will refuse to run unless the connection is Npgsql and the database name is exactly `fish_test` (Development: `fish_dev`).

### Production

`appsettings.Production.json` forces `TestData:Enabled` to `false`. Starting the API with test data enabled in Production throws. The reset routes are not registered and return 404.

## Run

From `api/`:

```bash
dotnet run --project Fish.Api --launch-profile http
```

- `http` profile: `http://localhost:5188`
- `https` profile: `https://localhost:7188` (and http on 5188)
- Health check: `GET /health` — returns 200 when the API is running

```bash
curl http://localhost:5188/health
```

Ports 5188 / 7188 are chosen so this app can sit alongside a local API.Framework instance (5088 / 7088) without a clash.

## Test

From `api/`:

```bash
dotnet build Fish.Api.sln --configuration Release
dotnet test Fish.Api.Tests/Fish.Api.Tests.csproj --configuration Release
```

The unit and host tests do not need a running PostgreSQL instance. They cover the health check, reset availability in Development and Test, reset unavailability in Production, configuration-secret scanning, and the reset guards (environment, key, database name, provider). A live master reset against PostgreSQL (`TRUNCATE` of model tables) needs the Test database and is intended for later e2e runs.

## Reset endpoint (Development and Test only)

| Item | Value |
|------|--------|
| Master | `POST /TestData/Reset/master` |
| Batch (hooks for later tickets) | `POST /TestData/Reset/{scenarioKey}` |
| Header | `X-Test-Data-Key`, compared with a fixed-time equals against the variable named by `TestData:KeyEnvVar` |
| Development database | `fish_dev` (`TestData:RequiredDatabase`) |
| Test database | `fish_test` |
| Production | unavailable (404); start-up fails if `TestData:Enabled` is true |

Because this test app has no sign-in, the reset call is not also gated by a JWT persona. It is still refused when the environment is not allowed, the key is missing or wrong, the provider is not PostgreSQL, or the database name does not match `RequiredDatabase`. Missing key at start-up means the controller is removed entirely.

A successful master reset truncates only EF model tables (none yet in this scaffold), never `__ef_migrations_history`, then runs registered seed units. Features add seed units by registering an `ITestSeedUnit` (the `baseline.migration-seed` hook is already registered).

## Project layout

| Project | Role |
|---------|------|
| `Fish.Api` | Host: `Program.cs`, controllers, health check, configuration |
| `Fish.Api.Services` | Area services and the test-data module (`TestData/`) |
| `Fish.Api.Data` | `FishDbContext`, design-time factory, `Migrations/` |
| `Fish.Api.Tests` | Unit and `WebApplicationFactory` tests |

Solution: `Fish.Api.sln`. All projects target `net10.0`.

New migrations, from `api/`:

```bash
dotnet ef migrations add <Name> --project Fish.Api.Data --startup-project Fish.Api
```

Do not run `dotnet ef database update` against a shared database, and do not commit `.env*` files or user-secret values.

## CORS

Development allows the local UI origins `http://localhost:3000` and `http://localhost:3003`. Add further origins in configuration, not as a wildcard with credentials.
