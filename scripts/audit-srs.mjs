// Read-only audit of the real application schedulers. Only writes disposable evidence.
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../.cache/srs-audit/', import.meta.url), { recursive: true });
await build({
  absWorkingDir: root, entryPoints: ['scripts/srs-audit/runner.ts'],
  outfile: '.cache/srs-audit/runtime.mjs', bundle: true, platform: 'node',
  format: 'esm', packages: 'external', tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
});
const result = spawnSync(process.execPath, ['.cache/srs-audit/runtime.mjs'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, TZ: 'UTC' },
});
process.exitCode = result.status ?? 1;
