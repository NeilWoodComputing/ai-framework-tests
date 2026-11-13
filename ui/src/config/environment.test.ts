import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('Committed configuration (T-SETUP-002 / S4)', () => {
  it('environment.ts reads only environment variable names, with no hardcoded API URL or app id', () => {
    const source = readFileSync(join(here, 'environment.ts'), 'utf8');
    expect(source).toMatch(/process\.env\.NEXT_PUBLIC_SYSTEM_API_ROOT/);
    expect(source).toMatch(/process\.env\.NEXT_PUBLIC_SYSTEM_APP_ID/);
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/);
  });

  it('api-routes.ts resolves paths through environment.apiRoot', () => {
    const source = readFileSync(join(here, 'api-routes.ts'), 'utf8');
    expect(source).toMatch(/environment\.apiRoot/);
    expect(source).not.toMatch(/https?:\/\//);
  });
});
