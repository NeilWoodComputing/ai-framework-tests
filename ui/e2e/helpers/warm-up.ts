import { getBaseUrl } from './config';

interface WarmUpRoute {
  label: string;
  path: string;
  headers?: Record<string, string>;
}

const routes: WarmUpRoute[] = [
  { label: 'home page', path: '/' },
  { label: 'component test harness', path: '/examples/test-harness' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits until the UI has compiled the key routes: requests each one, retrying until it answers 200,
 * so the first scenario cannot abort while `next dev` is still compiling.
 * E2E_SKIP_WARMUP=1 turns it off. E2E_WARMUP_TIMEOUT_MS defaults to 240000.
 */
export async function warmUpUi(timeoutMs = Number(process.env.E2E_WARMUP_TIMEOUT_MS) || 240_000): Promise<void> {
  if (process.env.E2E_SKIP_WARMUP) return;
  const base = getBaseUrl();
  const started = Date.now();
  const deadline = started + timeoutMs;
  for (const route of routes) {
    let last = 'no response';
    let attempts = 0;
    for (;;) {
      attempts += 1;
      try {
        const response = await fetch(`${base}${route.path}`, {
          headers: route.headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(Math.max(5_000, Math.min(120_000, deadline - Date.now()))),
        });
        await response.arrayBuffer();
        if (response.status === 200) break;
        last = `HTTP ${response.status}`;
      } catch (error) {
        last = error instanceof Error ? error.name : 'request failed';
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `UI warm-up: ${route.label} (${route.path}) did not answer 200 within ${Math.round(timeoutMs / 1000)} s (last: ${last}). Is \`npm run dev:test\` running on ${base}?`
        );
      }
      await sleep(2_000);
    }
    console.log(
      `UI warm-up: ${route.label} 200 (${attempts} attempt${attempts === 1 ? '' : 's'}, ${((Date.now() - started) / 1000).toFixed(1)} s)`
    );
  }
}
