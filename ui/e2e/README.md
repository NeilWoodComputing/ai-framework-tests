# Fish UI e2e setup

Playwright + playwright-bdd (Playwright **1.56.1**) against the Fish UI at `http://localhost:3003`. This scaffold has **no sign-in** and no test-data reset; Fish API scenarios arrive in later tickets.

## Commands (from this `e2e/` folder)

```bash
npm install
npx playwright install chromium
npm test                 # bddgen + playwright test (UI warm-up, then home-page and harness features)
```

| Env var | Purpose |
|---------|---------|
| `BASE_URL` | Optional; default `http://localhost:3003`. Playwright starts `npm run dev:test` on this port when nothing is listening. |
| `E2E_UI_API_ROOT` | Optional; passed to `npm run dev:test` as the API root (env var only; no `.env*` file is written). |
| `API_URL` | Fish Test API, for later API steps. No `/v1`. Unset is an error if a step calls `getApiUrl()`. |
| `E2E_SKIP_WARMUP` | Set to `1` to skip route warm-up. |
| `E2E_NO_WEB_SERVER` | Set to skip Playwright starting the UI (when you already have it running). |

The component test harness is at `/examples/test-harness` (404 in production builds). Its scenarios exercise shared Switch, boolean circle cell, row-actions and form controls with local React state only.
