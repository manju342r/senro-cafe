/**
 * Seed menu into the configured Supabase project (service role).
 * Usage: node scripts/seed-supabase-menu.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadEnv() {
  const raw = fs.readFileSync(path.join(root, '.env'), 'utf8')
  return Object.fromEntries(
    raw
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  )
}

// Import compiled seed is TS — duplicate minimal load via dynamic transpile skip:
// read seed by evaluating through vite? Instead import from dist isn't available.
// Use a lightweight fetch of the seed module via tsx if present, else inline require of built path.
async function loadSeed() {
  try {
    const { register } = await import('node:module')
    // Prefer tsx
    const { spawnSync } = await import('node:child_process')
    const out = spawnSync(
      'npx',
      ['--yes', 'tsx', '-e', "import { SEED_CATEGORIES, SEED_ITEMS, SEED_INGREDIENTS, SEED_RECIPES } from './src/lib/seed.ts'; console.log(JSON.stringify({ SEED_CATEGORIES, SEED_ITEMS, SEED_INGREDIENTS, SEED_RECIPES }))"],
      { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
    )
    if (out.status !== 0) throw new Error(out.stderr || out.stdout)
    return JSON.parse(out.stdout.trim().split('\n').filter(Boolean).at(-1))
  } catch (e) {
    console.error('Failed to load seed via tsx:', e.message)
    process.exit(1)
  }
}

async function rest(url, key, method, table, body) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`${method} ${table}: ${res.status} ${await res.text()}`)
  }
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const seed = await loadSeed()

console.log('Seeding', url)
console.log('categories', seed.SEED_CATEGORIES.length, 'items', seed.SEED_ITEMS.length)

await rest(url, key, 'POST', 'menu_categories?on_conflict=id', seed.SEED_CATEGORIES)
await rest(url, key, 'POST', 'menu_items?on_conflict=id', seed.SEED_ITEMS)
if (seed.SEED_INGREDIENTS?.length) {
  await rest(url, key, 'POST', 'ingredients?on_conflict=id', seed.SEED_INGREDIENTS)
}
if (seed.SEED_RECIPES?.length) {
  await rest(url, key, 'POST', 'recipe_ingredients?on_conflict=id', seed.SEED_RECIPES)
}

const check = await fetch(`${url}/rest/v1/menu_items?select=id&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})
console.log('verify menu_items', check.status, await check.text())
console.log('Done. Hard-refresh the app.')
