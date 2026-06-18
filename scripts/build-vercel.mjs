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

function normalizeExpoEnv() {
  if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY) {
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  }
  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY && process.env.OPENAI_API_KEY) {
    process.env.EXPO_PUBLIC_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }
}

// Merge committed defaults + local .env (dev only; .env is not on Vercel).
loadEnvFile('.env.production');
loadEnvFile('.env');
normalizeExpoEnv();

// Expo skips gitignored dotenv files, so Vercel dashboard vars must come from process.env.
process.env.EXPO_NO_DOTENV = '1';
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
const hasAi = Boolean(process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);
const expoPublicKeys = Object.keys(process.env).filter((k) => k.startsWith('EXPO_PUBLIC_')).sort();
console.log(`Build env: APP_URL=${process.env.EXPO_PUBLIC_APP_URL || '(unset)'} supabase=${hasSupabase ? 'yes' : 'no'} ai=${hasAi ? 'yes' : 'no'}`);
console.log(`EXPO_PUBLIC keys: ${expoPublicKeys.join(', ') || '(none)'}`);
if (!hasAi) {
  console.warn('\n⚠ AI disabled: set EXPO_PUBLIC_ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables (Production), then redeploy.\n');
}

run('expo export', 'npx', ['expo', 'export', '--platform', 'web', '--clear']);
run('verify dist', 'node', ['scripts/verify-dist.mjs']);
