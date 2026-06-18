/**
 * Sync EXPO_PUBLIC_* vars from .env to the linked Vercel project.
 * Required for GitHub → Vercel builds to match local dev (keys are baked in at build time).
 *
 * Usage:
 *   1. Create a token at https://vercel.com/account/tokens
 *   2. Add to .env: VERCEL_TOKEN=...
 *   3. npm run setup:vercel
 *
 * Optional: VERCEL_PROJECT_ID and VERCEL_TEAM_ID in .env (auto-detected from .vercel/project.json if linked).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envPath = join(root, '.env');
const vercelProjectPath = join(root, '.vercel', 'project.json');

function loadEnv() {
  const out = {};
  if (!existsSync(envPath)) return out;
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  });
  return out;
}

function loadVercelProject() {
  if (!existsSync(vercelProjectPath)) return {};
  try {
    return JSON.parse(readFileSync(vercelProjectPath, 'utf8'));
  } catch {
    return {};
  }
}

const env = loadEnv();
const token = env.VERCEL_TOKEN || process.env.VERCEL_TOKEN;
const project = loadVercelProject();
const projectId = env.VERCEL_PROJECT_ID || project.projectId;
const teamId = env.VERCEL_TEAM_ID || project.orgId;

const EXPO_KEYS = [
  'EXPO_PUBLIC_APP_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_FOOD_API_PROVIDER',
  'EXPO_PUBLIC_FOOD_API_KEY',
  'EXPO_PUBLIC_USDA_API_KEY',
  'EXPO_PUBLIC_ANTHROPIC_API_KEY',
  'EXPO_PUBLIC_OPENAI_API_KEY',
  'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

const toSync = EXPO_KEYS.filter((key) => env[key]);

if (!token) {
  console.error('Missing VERCEL_TOKEN.');
  console.error('Create one at https://vercel.com/account/tokens and add it to .env, then run: npm run setup:vercel');
  console.error('\nOr set these manually in Vercel → Project → Settings → Environment Variables (Production):');
  toSync.forEach((key) => console.error(`  ${key}`));
  process.exit(1);
}

if (!projectId) {
  console.error('Missing Vercel project id. Run `npx vercel link` in this folder, or set VERCEL_PROJECT_ID in .env.');
  process.exit(1);
}

async function listEnv() {
  const qs = teamId ? `?teamId=${teamId}` : '';
  const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`List env failed (${res.status}): ${await res.text()}`);
  return res.json().envs || [];
}

async function upsertEnv(key, value) {
  const qs = teamId ? `?teamId=${teamId}` : '';
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env${qs}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  });
  if (res.status === 409) {
    const existing = await listEnv();
    const match = existing.find((e) => e.key === key && e.target?.includes('production'));
    if (!match) throw new Error(`Env ${key} exists but could not update`);
    const patchQs = teamId ? `?teamId=${teamId}` : '';
    const patch = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${match.id}${patchQs}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });
    if (!patch.ok) throw new Error(`Update ${key} failed (${patch.status}): ${await patch.text()}`);
    return 'updated';
  }
  if (!res.ok) throw new Error(`Create ${key} failed (${res.status}): ${await res.text()}`);
  return 'created';
}

async function triggerRedeploy() {
  console.log('\nRedeploy production from Vercel → Deployments → Redeploy (or push a commit to main).');
}

(async () => {
  console.log(`Syncing ${toSync.length} EXPO_PUBLIC_* vars to Vercel project ${projectId}…`);
  for (const key of toSync) {
    const action = await upsertEnv(key, env[key]);
    console.log(`  ${key}: ${action}`);
  }
  console.log('\nDone. Triggering production redeploy…');
  await triggerRedeploy();
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
