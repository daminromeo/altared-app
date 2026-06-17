#!/usr/bin/env tsx
/**
 * blog:check-sitemap — post-batch sitemap verification + resubmit reminder.
 *
 * Run this after each blog batch (and any time you want to confirm the drip is
 * being discovered). It:
 *   1. Confirms every currently-published post (publishedAt <= now) appears in
 *      the LIVE sitemap.
 *   2. Reminds you to resubmit sitemap.xml in Google Search Console.
 *
 * Why the manual resubmit matters: Google deprecated the sitemap ping endpoint
 * in 2023, so the only way to force a fresh read is a resubmit in Search Console
 * (or the Search Console API). Without it, Google's "Last read" can lag for
 * weeks and newly-dripped posts stay "URL is unknown to Google" — which is
 * exactly the gap that stalled discovery in June 2026.
 *
 * Usage:
 *   npm run blog:check-sitemap
 *   npm run blog:check-sitemap -- --site https://altared.app
 *   npm run blog:check-sitemap -- --indexnow   # also notify IndexNow (Bing/Yandex; NOT Google)
 *
 * Exit code is non-zero if any published post is missing from the live sitemap,
 * so it's safe to wire into CI.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..", "..")
const POSTS_DIR = path.join(ROOT, "src", "content", "blog")

dotenv.config({ path: path.join(ROOT, ".env.local") })

type Args = { site: string; indexnow: boolean }

// Production canonical host. This check is always about the live sitemap Google
// reads, so we ignore a localhost NEXT_PUBLIC_APP_URL (set for dev) and default
// here. Override with --site for previews/other environments.
const PROD_SITE = "https://altared.app"

function defaultSite(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (!env || /localhost|127\.0\.0\.1/.test(env)) return PROD_SITE
  return env
}

function parseArgs(argv: string[]): Args {
  let site = defaultSite()
  let indexnow = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--site") site = argv[++i].replace(/\/$/, "")
    else if (a === "--indexnow") indexnow = true
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: npm run blog:check-sitemap [-- --site <url>] [--indexnow]"
      )
      process.exit(0)
    }
  }
  return { site, indexnow }
}

// Slugs of posts whose publishedAt has passed (i.e. live + sitemap-eligible).
function publishedSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const now = Date.now()
  const out: string[] = []
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith(".mdx")) continue
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8")
    const { data } = matter(raw)
    const pa = data.publishedAt ? new Date(data.publishedAt).getTime() : NaN
    if (!Number.isNaN(pa) && pa <= now) out.push(file.replace(/\.mdx$/, ""))
  }
  return out
}

async function liveSitemapSlugs(site: string): Promise<Set<string>> {
  const res = await fetch(`${site}/sitemap.xml`, {
    headers: { "user-agent": "altared-sitemap-check" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  const escaped = site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // Trailing </loc> in the pattern excludes /blog/category/<slug> URLs.
  const re = new RegExp(`<loc>${escaped}/blog/([^<\\/]+)</loc>`, "g")
  const slugs = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) slugs.add(m[1])
  return slugs
}

async function pingIndexNow(site: string, slugs: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY
  if (!key) {
    console.log(
      "  (skip) INDEXNOW_KEY not set in .env.local — IndexNow not pinged."
    )
    return
  }
  const host = new URL(site).host
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${site}/${key}.txt`,
      urlList: slugs.map((s) => `${site}/blog/${s}`),
    }),
  })
  console.log(
    `  IndexNow: HTTP ${res.status} for ${slugs.length} URLs ` +
      `(requires ${site}/${key}.txt to be live; 422 = key file not found).`
  )
}

async function main() {
  const { site, indexnow } = parseArgs(process.argv.slice(2))

  const local = publishedSlugs().sort()
  if (local.length === 0) {
    console.error("No published posts found. Nothing to check.")
    process.exit(1)
  }

  let live: Set<string>
  try {
    live = await liveSitemapSlugs(site)
  } catch (err) {
    console.error(
      `✗ Could not read live sitemap at ${site}/sitemap.xml: ${
        err instanceof Error ? err.message : err
      }`
    )
    process.exit(2)
  }

  const missing = local.filter((s) => !live.has(s))

  console.log(`Site: ${site}`)
  console.log(`Published posts (local):   ${local.length}`)
  console.log(`Blog URLs in live sitemap: ${live.size}`)

  if (missing.length > 0) {
    console.log(`\n✗ ${missing.length} published post(s) MISSING from the live sitemap:`)
    for (const s of missing) console.log(`    - ${s}`)
    console.log(
      `\nLikely the latest deploy hasn't propagated or ISR hasn't regenerated the\n` +
        `sitemap yet. Re-run in a few minutes; if it persists, confirm the deploy\n` +
        `succeeded and src/app/sitemap.ts still exports \`revalidate\`.`
    )
  } else {
    console.log(`\n✓ All ${local.length} published posts are in the live sitemap.`)
  }

  console.log(`\n── Resubmit in Search Console (forces Google to re-read) ────────────`)
  console.log(`Google deprecated sitemap ping, so re-reads are manual:`)
  console.log(`  1. Search Console → Sitemaps`)
  console.log(`  2. Under "Add a new sitemap", enter:  sitemap.xml`)
  console.log(`  3. Submit. Confirm "Last read" = today (Discovered pages counts these`)
  console.log(`     ${live.size} posts plus the static + category URLs).`)
  console.log(`Then URL Inspection → Request Indexing on your top few posts.`)

  if (indexnow) {
    console.log(`\n── IndexNow (Bing / Yandex / Seznam — NOT Google) ───────────────────`)
    await pingIndexNow(site, local)
  }

  process.exit(missing.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
