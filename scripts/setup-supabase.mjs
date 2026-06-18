/**
 * Deploy Supabase edge functions + auth redirect URLs.
 * Preserves existing Netlify/local redirect URLs.
 *
 * Usage:
 *   node scripts/setup-supabase.mjs
 *   node scripts/setup-supabase.mjs --app-url https://your-site.netlify.app
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const envPath = join(root, '.env');
const configPath = join(root, 'supabase', 'config.toml');

const DEFAULT_REDIRECTS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://127.0.0.1:8081',
  'exp://localhost:8081',
  'foodprint://auth/callback',
  'https://foodprint-pro.netlify.app',
  'https://chimerical-meerkat-d571bc.netlify.app',
  'https://chimerical-meerkat-d571bc.netlify.app/auth/callback',
];

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const out = {};
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  });
  return out;
}

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: root });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

const env = loadEnv();
const appUrl = (parseArg('--app-url') || env.EXPO_PUBLIC_APP_URL || 'https://foodprint-pro.vercel.app').replace(/\/$/, '');

const redirectUrls = new Set([
  ...DEFAULT_REDIRECTS,
  appUrl,
  `${appUrl}/auth/callback`,
  'https://foodprint-pro.vercel.app',
  'https://foodprint-pro.vercel.app/auth/callback',
]);

const urls = [...redirectUrls].map((u) => `  "${u}"`).join(',\n');
const toml = `# Auto-updated by scripts/setup-supabase.mjs\nproject_id = "asnzsjweamnkhkvmpkcq"\n\n[auth]\nenabled = true\nsite_url = "${appUrl}"\nadditional_redirect_urls = [\n${urls}\n]\n`;
writeFileSync(configPath, toml, 'utf8');
console.log(`Updated supabase/config.toml → site_url=${appUrl}`);

console.log('Step 1/3 — Push auth redirect URLs (Google OAuth on web/Netlify)');
run('npx', ['supabase', 'config', 'push']);

console.log('Step 2/3 — Set Stripe edge function secrets');
const secrets = [
  ['STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY],
  ['STRIPE_MONTHLY_PRICE_ID', env.STRIPE_MONTHLY_PRICE_ID],
  ['STRIPE_ANNUAL_PRICE_ID', env.STRIPE_ANNUAL_PRICE_ID],
  ['APP_URL', appUrl],
].filter(([, v]) => v);

if (!secrets.length) {
  console.warn('No Stripe secrets in .env — skip setting secrets or add STRIPE_* keys.');
} else {
  for (const [key, value] of secrets) {
    run('npx', ['supabase', 'secrets', 'set', `${key}=${value}`]);
  }
}

console.log('Step 3/3 — Deploy payment edge functions');
for (const fn of ['create-checkout', 'verify-checkout', 'stripe-checkout']) {
  run('npx', ['supabase', 'functions', 'deploy', fn]);
}

console.log('\nSupabase backend setup complete.');
console.log('Enable Google in Supabase Dashboard → Auth → Providers → Google');
console.log(`Google Cloud authorized origin: ${appUrl}`);
