# AGENTS.md — Fish UI (`ui/`)

Guidance for coding agents working on the Fish test app's Next.js UI. This app was scaffolded from **UI.NextJs.Framework** in [AI-framework](https://github.com/NeilWoodComputing/AI-framework) on `main`.

## Read first

1. `README.md` — setup, run, test, configure
2. `.cursor/rules/README.md` — rule index (Cursor loads `.mdc` files from `.cursor/rules/`)
3. `src/framework/design-system/README.md` — **component library** catalogue (start here for UI)
4. `src/framework/README.md` — framework pattern index

Always-applied rules cover architecture, formatting, and implementation approach. Focused rules under `framework/` and `style/` activate by glob.

## Component library first

Prefer `@design-system` primitives (`Button`, `Input`, `PageLayout`, typography, `Callout`, `Icon`, `Switch`, form modal, `ConfirmModal`, etc.) before custom markup. Live demo: `/design-system`. Rules: `style/nextjs-design-system.mdc`, `style/nextjs-components.mdc`, `style/nextjs-css.mdc`.

## List pages vs modals (standing rule)

- A feature list with its own route renders filters + results **on the page**. No list / results modal, no auto-opened modal.
- Modals are only for create / edit forms (`RoutedModal`) and confirmations (`ConfirmModal`).
- Rule: `.cursor/rules/framework/nextjs-list-pages.mdc`.

## Standing forms rule

- Schema is built on the API (forms builder) and fetched by the UI
- Client validates against that schema while editing — no duplicate hand-written field rules
- Server-only checks run on submit; display API errors on the form

## API / env

- Calls go through `systemApiFetch` and `apiRoutes` to the Fish API (API.Framework, versionless routes, no `/v1`) at `environment.apiRoot`
- Neil sets `NEXT_PUBLIC_SYSTEM_API_ROOT` in `.env.local` (see `.env.example`)
- **Never create or edit `.env` or `.env.local`. Never put secrets or hardcoded API URLs in committed settings** — refer to environment variable names only.

## This app has no sign-in

Do not add a sign-in page, an auth gate on routes, or committed credentials. `AuthProvider` is in the root layout only so `@entity-framework` hooks that call `useAuth()` have a context; the session starts null.

## Do not

- Invent a `Grok/` or other agent-specific folder — Cursor guidance is `.cursor/rules` + this `AGENTS.md` only
- Bypass `@design-system` with one-off styled buttons/inputs when a primitive exists
- Use raw hex (or other literal) colours; use design-system tokens
- Build the Fish list, grid, form or delete confirmation here if the ticket in hand is not that work (T-FISH-003–006)

## Verify

```bash
npm run lint      # eslint . (e2e/ excluded)
npm run typecheck # tsc --noEmit
npm test          # Vitest component / hook tests
npm run build     # production build
```

UI against a Test API (e2e): `npm run dev:test` (no `.env*` edits; see `README.md`).
