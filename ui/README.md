# Fish UI

Next.js 15 UI for the Fish test app, in `ui/`. It follows the **UI.NextJs.Framework** principles from [AI-framework](https://github.com/NeilWoodComputing/AI-framework) (`origin/main`): app structure, layout shell, design-token CSS (no raw hex), and the standing list-page rule — filters and results stay on the page; modals are only for create/edit forms and confirmations.

This ticket (T-SETUP-002) is an empty scaffold: there is no Fish list, grid or form yet, and **the app has no sign-in and no authentication**. The Fish nav entry is in the shell, ready for T-FISH-006 (#21).

## Prerequisites

- Node.js 22 LTS or later (Node 24 is fine)
- npm (bundled with Node)

## Configure

```bash
cd ui
cp .env.example .env.local
```

Edit `.env.local` and set the API base URL. Only an `.env.example` is committed; never commit `.env` or `.env.local`.

| Environment variable | Purpose |
|----------------------|---------|
| `NEXT_PUBLIC_SYSTEM_API_ROOT` | Base URL of the Fish API (API.Framework, no `/v1` segment). Read by `src/config/environment.ts` under this name only. |

Restart `npm run dev` after changing env vars. Next.js inlines `NEXT_PUBLIC_*` values at dev-server start and at `npm run build`.

To point a dev server at the Test API without editing any `.env*` file, use `npm run dev:test` and set `E2E_UI_API_ROOT` (or `NEXT_PUBLIC_SYSTEM_API_ROOT`) in the process environment. See `scripts/dev-test.mjs`.

## Run

```bash
cd ui
npm install
npm run dev
```

The UI serves at [http://localhost:3003](http://localhost:3003).

| Script | What it does |
|--------|----------------|
| `npm run dev` | Next.js dev server on port 3003 |
| `npm run dev:test` | Dev server for e2e, API root from `E2E_UI_API_ROOT`, build dir `.next-test` |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3003 |

| URL | Purpose |
|-----|---------|
| `/` | Home page, with the layout shell (`PageLayout` + `SiteNav`) |
| `/fish` | Reserved for the Fish list page (T-FISH-006). Not implemented in this scaffold. |
| `/design-system` | Live catalogue of shared design-system components |
| `/examples/test-harness` | Component test harness (dev / test only; **404 in production builds**) |

## Test

From `ui/`:

```bash
npm run lint        # eslint . (flat config; e2e/ excluded)
npm run typecheck   # tsc --noEmit
npm test            # Vitest component / hook tests (src/**/*.test.ts(x), jsdom)
npm run build       # production build
```

The Vitest suite includes a home-page layout-shell test (S2), a component-harness test (S3), a check that committed config uses env var names only (S4), and the framework's existing modal and JSON-schema form tests.

### Component test harness

```bash
npm test            # includes ComponentTestHarness.test.tsx
npm run dev         # then open http://localhost:3003/examples/test-harness
```

The harness exercises the shared Switch, boolean circle cell, row actions menu, form controls and confirm/form modal primitives with local React state only (no API). It is not linked from the site nav, and `src/app/examples/test-harness/page.tsx` returns 404 when `NODE_ENV=production`.

### End-to-end setup

Playwright + playwright-bdd scaffolding lives in `e2e/` (Playwright 1.56.x). There is no sign-in project and no test-data reset in this scaffold — this app has no authentication, and the Fish API is added in later tickets.

```bash
cd ui/e2e
npm install
npx playwright install chromium
npm test                 # bddgen + Playwright (home-page shell + component harness)
```

`BASE_URL` defaults to `http://localhost:3003`. Playwright starts `npm run dev:test` when nothing is already listening. See `e2e/README.md`.

## Project layout

```
ui/
├── .cursor/rules/          # UI.NextJs.Framework Cursor rules (design system, list pages, grids, forms)
├── .env.example            # committed; copy to .env.local
├── AGENTS.md               # entry point for coding agents
├── e2e/                    # Playwright + playwright-bdd setup
├── src/
│   ├── app/                # App Router: layout, home, design-system, test-harness
│   ├── config/             # environment and api-routes (env var names only)
│   ├── shell/              # SiteNav (layout shell navigation)
│   ├── features/
│   │   ├── design-system-showcase/
│   │   └── test-harness/   # ComponentTestHarness
│   └── framework/
│       ├── api/            # systemApiFetch
│       ├── auth/           # session helpers (unused for sign-in in this app)
│       ├── design-system/  # Switch, Button, PageLayout, form modal, confirm modal, …
│       ├── entity-framework/  # EntityGrid, row actions menu, boolean circle cell
│       └── json-schema-form/
```

### Shared components (available for later tickets)

| Component | Where |
|-----------|--------|
| Switch | `@design-system` (`src/framework/design-system/forms/switch/`) |
| Form modal (`Modal`, `RoutedModal`, `ModalShell`) | `@design-system` |
| Confirm modal | `@design-system` (`ConfirmModal`) |
| Row actions menu | `@entity-framework` (`EntityGridRowActionsMenu`) |
| Boolean circle cell | `@entity-framework` (`renderBooleanIconCell`, Decision 30 tokens) |

Copy a list page from the framework recipes in `AGENTS.md` and `.cursor/rules/` when building T-FISH-003 / T-FISH-006. Do not invent raw hex colours; use the design-system tokens in `src/framework/design-system/theme/tokens.css`.

## Agents

- `AGENTS.md` — standing guidance
- `.cursor/rules/` — Cursor rules from UI.NextJs.Framework (start with `style/nextjs-design-system.mdc` and `framework/nextjs-list-pages.mdc`)
- Component catalogue: `src/framework/design-system/README.md`
