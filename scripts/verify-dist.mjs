import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function loadDotEnv() {
  ['.env.production', '.env'].forEach((file) => {
    const envPath = join(process.cwd(), file);
    if (!existsSync(envPath)) return;
    readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const i = t.indexOf('=');
      if (i === -1) return;
      const key = t.slice(0, i).trim();
      const val = t.slice(i + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    });
  });
  if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY) {
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  }
}

loadDotEnv();

const root = join(process.cwd(), 'dist');
let ok = true;

if (!existsSync(root)) {
  console.error('dist/ folder not found — run: npm run build:vercel');
  process.exit(1);
}

const jsDir = join(root, '_expo', 'static', 'js', 'web');
const bundles = existsSync(jsDir) ? readdirSync(jsDir).filter((f) => f.endsWith('.js')) : [];
if (!bundles.length) {
  console.error('No JS bundle found in dist/_expo/static/js/web/');
  ok = false;
}

const bundleName = bundles[0] || '';
const buildVersion = bundleName.replace(/^index-/, '').replace(/\.js$/, '') || String(Date.now());
writeFileSync(
  join(root, 'build-version.json'),
  `${JSON.stringify({ version: buildVersion, builtAt: new Date().toISOString(), bundle: bundleName }, null, 2)}\n`,
);

const required = [
  'index.html',
  '_redirects',
  '_headers',
  'manifest.json',
  'favicon.ico',
  'apple-touch-icon.png',
  'build-version.json',
  join('_expo', 'static', 'js', 'web'),
];

for (const rel of required) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    console.error(`Missing dist/${rel.replace(/\\/g, '/')}`);
    ok = false;
  }
}

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
if (!indexHtml.includes('manifest.json')) {
  console.error('dist/index.html is missing manifest.json link');
  ok = false;
}
if (!indexHtml.includes('/_expo/static/js/web/')) {
  console.error('dist/index.html is missing Expo web bundle script');
  ok = false;
}
if (bundleName && !indexHtml.includes(bundleName)) {
  console.error(`dist/index.html does not reference ${bundleName}`);
  ok = false;
}

const buildEnv = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_APP_URL',
];
const missingEnv = buildEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.warn('\nBuild-time env not set (set in .env locally or Vercel → Project Settings → Environment Variables):');
  missingEnv.forEach((key) => console.warn(`  - ${key}`));
  console.warn('OAuth/Stripe return URLs fall back to window.location.origin at runtime if APP_URL is unset.\n');
}

if (!ok) {
  process.exit(1);
}

if (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY && bundleName) {
  const bundlePath = join(jsDir, bundleName);
  const bundle = readFileSync(bundlePath, 'utf8');
  if (!bundle.includes('sk-ant-api')) {
    console.error('Build has EXPO_PUBLIC_ANTHROPIC_API_KEY in env but it was not baked into the JS bundle.');
    process.exit(1);
  }
  console.log('  AI key: baked into bundle');
} else if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
  console.warn('  AI key: not set at build time (AI chat/meals will be disabled)');
}

console.log('dist/ is ready for Vercel deploy (mobile PWA).');
console.log(`  Bundle: _expo/static/js/web/${bundleName}`);
console.log(`  Version: ${buildVersion}`);
console.log('  Publish: connect repo to Vercel (vercel.json) or run `npx vercel deploy --prebuilt`');
