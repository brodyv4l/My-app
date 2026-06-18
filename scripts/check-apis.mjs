/**
 * Quick connectivity check for external services (reads .env locally).
 * Usage: node scripts/check-apis.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(process.cwd(), '.env');
const env = {};
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  });
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    return false;
  }
}

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const usdaKey = env.EXPO_PUBLIC_USDA_API_KEY || env.EXPO_PUBLIC_FOOD_API_KEY;
const anthropicKey = env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

await check('Supabase project', async () => {
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or ANON_KEY');
  const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: supabaseKey },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

await check('Supabase users table', async () => {
  const res = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (res.status === 404 || res.status === 406) throw new Error('Table missing — check Supabase project');
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('relation') || text.includes('does not exist')) {
      throw new Error('users table missing');
    }
    throw new Error(`HTTP ${res.status}`);
  }
});

await check('USDA FoodData Central', async () => {
  if (!usdaKey) throw new Error('Missing EXPO_PUBLIC_USDA_API_KEY');
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=apple&pageSize=1&api_key=${usdaKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

await check('Anthropic API', async () => {
  if (!anthropicKey) throw new Error('Missing EXPO_PUBLIC_ANTHROPIC_API_KEY');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Say OK' }],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
});

await check('Open Food Facts', async () => {
  const res = await fetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=apple&json=1&page_size=1');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

console.log('\nDone. Fix any ❌ items above before deploying.');
