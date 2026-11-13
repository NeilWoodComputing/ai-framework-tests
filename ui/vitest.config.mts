import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

// Component / hook tests (`npm test`). Aliases mirror tsconfig.json paths.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@design-system$/, replacement: src('framework/design-system/index.ts') },
      { find: /^@design-system\//, replacement: src('framework/design-system/') },
      { find: /^@entity-framework$/, replacement: src('framework/entity-framework/index.ts') },
      { find: /^@entity-framework\//, replacement: src('framework/entity-framework/') },
      { find: /^@json-schema-form$/, replacement: src('framework/json-schema-form/index.ts') },
      { find: /^@json-schema-form\//, replacement: src('framework/json-schema-form/') },
      { find: /^@auth\//, replacement: src('framework/auth/') },
      { find: /^@shell\//, replacement: src('shell/') },
      { find: /^@features\//, replacement: src('features/') },
      { find: /^@\//, replacement: src('') },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
