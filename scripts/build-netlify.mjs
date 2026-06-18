import { spawnSync } from 'node:child_process';

function run(label, command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    console.error(`${label} failed`);
    process.exit(result.status ?? 1);
  }
}

run('expo export', 'npx', ['expo', 'export', '--platform', 'web']);
run('verify dist', 'node', ['scripts/verify-dist.mjs']);
