// `npm run dev:test`: next dev pointed at the local Test API (launch profile Test, :7188) without
// creating or editing any .env* file. Process env wins over .env.local, so the dev settings stay as they are.
//   API root: E2E_UI_API_ROOT (default https://localhost:7188/, no version segment)
//   Port:     --port / -p / a bare number, else PORT, else 3003
//   Build dir: NEXT_DIST_DIR (default .next-test), so it never shares a cache with `npm run dev`
// next dev adds `<distDir>/types/**/*.ts` to tsconfig.json for any other build dir; tsconfig.json is put back
// byte-for-byte when this process ends so scratch build dirs never stick in the committed include list.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');

// Port: `--port <n>`, `--port=<n>`, `-p <n>` or a bare number (PowerShell's npm shim drops `--`, so
// `npm run dev:test -- --port 3013` arrives here as just `3013`), else PORT, else 3003.
let port = process.env.PORT || '3003';
const passThrough = [];
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--port' || arg === '-p') port = args[(index += 1)];
  else if (arg.startsWith('--port=')) port = arg.slice('--port='.length);
  else if (/^\d+$/.test(arg)) port = arg;
  else passThrough.push(arg);
}
const apiRoot = process.env.E2E_UI_API_ROOT || process.env.NEXT_PUBLIC_SYSTEM_API_ROOT || '';
const distDir = process.env.NEXT_DIST_DIR || '.next-test';

const tsconfigPath = new URL('../tsconfig.json', import.meta.url);
const tsconfigBefore = readFileSync(tsconfigPath);
function restoreTsconfig() {
  try {
    if (!readFileSync(tsconfigPath).equals(tsconfigBefore)) {
      writeFileSync(tsconfigPath, tsconfigBefore);
      console.log('dev:test -> restored tsconfig.json (next dev had added a build-dir include)');
    }
  } catch (error) {
    console.error(`dev:test -> could not restore tsconfig.json: ${error.message}`);
  }
}

console.log(`dev:test -> UI http://localhost:${port}, API ${apiRoot}, build dir ${distDir}`);

const child = spawn(process.execPath, [nextBin, 'dev', '-p', port, ...passThrough], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_SYSTEM_API_ROOT: apiRoot, NEXT_DIST_DIR: distDir },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  restoreTsconfig();
  process.exit(code ?? (signal ? 1 : 0));
});
