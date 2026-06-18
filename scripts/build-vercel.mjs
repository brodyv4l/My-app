import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function loadEnvFile(filename) {
  const path = join(process.cwd(), filename);
  if (!existsSync(path)) return;
  readFileSync(path, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

// Vercel GitHub builds have no .env — load committed production defaults first.
loadEnvFile('.env.production');
loadEnvFile('.env');

process.env.NODE_ENV = 'production';

function run(label, command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: process.cwd(),
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`${label} failed`);
    process.exit(result.status ?? 1);
  }
}

const hasSupabase = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
console.log(`Build env: APP_URL=${process.env.EXPO_PUBLIC_APP_URL || '(unset)'} supabase=${hasSupabase ? 'yes' : 'no'}`);

run('expo export', 'npx', ['expo', 'export', '--platform', 'web']);
run('verify dist', 'node', ['scripts/verify-dist.mjs']);
