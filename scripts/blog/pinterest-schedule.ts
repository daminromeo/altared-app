#!/usr/bin/env tsx
/**
 * blog:pinterest-schedule — generate Pinterest pins from published blog posts
 * and schedule them via the Postiz public API.
 *
 * For each PUBLISHED, not-yet-pinned post it builds one pin:
 *   - image: public/blog/<slug>.jpg (uploaded to Postiz from its live URL)
 *   - title: the post title (<=100 chars)
 *   - description: meta description + a few board-specific keywords/hashtags
 *   - link: https://altared.app/blog/<slug>  ← the SEO destination link
 *   - board: routed by vendor tag first, then category (see routeBoard)
 *
 * INCREMENTAL: slugs that have been pinned are recorded in scripts/blog/.pinned.json
 * and skipped on later runs, so re-running only pins NEW posts (no duplicates).
 * Use --force to ignore the ledger; --only always bypasses it.
 *
 * SAFE BY DEFAULT: dry-run unless --execute. With --execute it creates posts of
 * --type (default "draft"; use "schedule" to auto-queue).
 *
 * Usage:
 *   npm run blog:pinterest-schedule                                  # dry-run, new posts only
 *   npm run blog:pinterest-schedule -- --execute --type schedule --per-day 5 --start 2026-06-30T09:00
 *   npm run blog:pinterest-schedule -- --only <slug> --execute --type draft   # one pin, ignores ledger
 *   npm run blog:pinterest-schedule -- --force ...                   # ignore ledger (re-pin everything)
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import dotenv from "dotenv"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..", "..")
const POSTS_DIR = path.join(ROOT, "src", "content", "blog")
const PUBLIC_BLOG = path.join(ROOT, "public", "blog")
const LEDGER = path.join(__dirname, ".pinned.json")

dotenv.config({ path: path.join(ROOT, ".env.local") })

const API_BASE = "https://api.postiz.com/public/v1"
const SITE = "https://altared.app"
const PINTEREST_INTEGRATION_ID = "cmqzfv34k021qk00y6gny1p17" // altaredapp

// Board ids fetched via integration-trigger { methodName: "boards" }.
const BOARDS = {
  hiddenCosts: "1108870808192966717",
  vendors: "1108870808192966726",
  budget: "1108870808192966722",
  catering: "1108870808192966729",
  photoFlowers: "1108870808192966732",
  contracts: "1108870808192966720",
  venue: "1108870808192966727",
}
const BOARD_NAMES: Record<string, string> = {
  [BOARDS.hiddenCosts]: "Hidden Wedding Costs & Fees",
  [BOARDS.vendors]: "How to Choose Wedding Vendors",
  [BOARDS.budget]: "Wedding Budget Tips",
  [BOARDS.catering]: "Wedding Catering & Bar Costs",
  [BOARDS.photoFlowers]: "Wedding Photography & Flowers",
  [BOARDS.contracts]: "Wedding Vendor Contracts & Red Flags",
  [BOARDS.venue]: "Wedding Venue Tips & Costs",
}
// Pinterest is a search engine; these double as keywords + hashtags per board.
const BOARD_TAGS: Record<string, string[]> = {
  [BOARDS.hiddenCosts]: ["#weddingbudget", "#hiddenweddingcosts", "#weddingplanning", "#weddingtips", "#bridetobe"],
  [BOARDS.vendors]: ["#weddingvendors", "#vendortips", "#weddingplanning", "#weddingadvice", "#bridetobe"],
  [BOARDS.budget]: ["#weddingbudget", "#budgetwedding", "#weddingplanning", "#weddingtips", "#bridetobe"],
  [BOARDS.catering]: ["#weddingcatering", "#weddingfood", "#weddingbar", "#weddingbudget", "#weddingplanning"],
  [BOARDS.photoFlowers]: ["#weddingphotographer", "#weddingflowers", "#weddingflorals", "#weddingvendors", "#weddingplanning"],
  [BOARDS.contracts]: ["#weddingcontracts", "#weddingvendors", "#weddingredflags", "#weddingplanning", "#bridetobe"],
  [BOARDS.venue]: ["#weddingvenue", "#venuetips", "#weddingplanning", "#weddingbudget", "#bridetobe"],
}

type Post = {
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  publishedAt: string
}

type Args = {
  execute: boolean
  type: "draft" | "schedule" | "now"
  start: Date
  perDay: number
  only?: string
  limit?: number
  force: boolean
  delay: number
  includeFuture: boolean
}

function die(msg: string): never {
  console.error(`error: ${msg}`)
  process.exit(1)
}

function parseArgs(argv: string[]): Args {
  const a: Args = { execute: false, type: "draft", start: tomorrow9am(), perDay: 5, force: false, delay: 4000, includeFuture: false }
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i]
    if (f === "--execute") a.execute = true
    else if (f === "--force") a.force = true
    else if (f === "--include-future") a.includeFuture = true
    else if (f === "--delay") a.delay = Number(argv[++i])
    else if (f === "--type") {
      const v = argv[++i]
      if (!["draft", "schedule", "now"].includes(v)) die(`bad --type: ${v}`)
      a.type = v as Args["type"]
    } else if (f === "--start") {
      const d = new Date(argv[++i])
      if (Number.isNaN(d.getTime())) die("bad --start")
      a.start = d
    } else if (f === "--per-day") a.perDay = Number(argv[++i])
    else if (f === "--only") a.only = argv[++i]
    else if (f === "--limit") a.limit = Number(argv[++i])
    else if (f === "--help" || f === "-h") { console.log("See header comment for usage."); process.exit(0) }
    else die(`unknown flag: ${f}`)
  }
  return a
}

function tomorrow9am(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d
}

function loadPosts(includeFuture: boolean): Post[] {
  const now = Date.now()
  const out: Post[] = []
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith(".mdx")) continue
    const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"))
    const pa = data.publishedAt ? new Date(data.publishedAt).getTime() : NaN
    if (Number.isNaN(pa)) continue
    if (pa > now && !includeFuture) continue // not yet live; its link would 404
    out.push({
      slug: file.replace(/\.mdx$/, ""),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      category: String(data.category ?? ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      publishedAt: new Date(pa).toISOString(),
    })
  }
  return out.sort((x, y) => x.publishedAt.localeCompare(y.publishedAt)) // oldest first
}

function routeBoard(post: Post): string {
  const t = post.tags.map((s) => s.toLowerCase()).join(" ")
  const has = (...w: string[]) => w.some((x) => t.includes(x))
  if (has("venue")) return BOARDS.venue
  if (has("catering", "bar", "service charge", "per plate", "caterer")) return BOARDS.catering
  if (has("photograph", "florist", "flower", "floral")) return BOARDS.photoFlowers
  switch (post.category) {
    case "contracts": return BOARDS.contracts
    case "budgeting": return BOARDS.budget
    case "vendor-tips": return BOARDS.vendors
    default: return BOARDS.hiddenCosts
  }
}

function pinFor(post: Post) {
  const board = routeBoard(post)
  const tags = BOARD_TAGS[board].join(" ")
  return {
    title: post.title.slice(0, 100),
    description: `${post.description}\n\n${tags}`.slice(0, 480),
    link: `${SITE}/blog/${post.slug}`,
    board,
    imageUrl: `${SITE}/blog/${post.slug}.jpg`,
    imageFile: path.join(PUBLIC_BLOG, `${post.slug}.jpg`),
  }
}

function readLedger(): Set<string> {
  try {
    return new Set(JSON.parse(fs.readFileSync(LEDGER, "utf8")) as string[])
  } catch {
    return new Set()
  }
}
function writeLedger(s: Set<string>) {
  fs.writeFileSync(LEDGER, JSON.stringify([...s].sort(), null, 2) + "\n")
}

function apiKey(): string {
  const k = process.env.POSTIZ_API_KEY
  if (!k) die("POSTIZ_API_KEY not set in .env.local")
  return k
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Postiz throttles the public API; retry on 429 (and transient 5xx) with backoff.
async function apiFetch(path: string, init: RequestInit, label: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Authorization: apiKey(), "Content-Type": "application/json", ...(init.headers ?? {}) },
    })
    if ((res.status !== 429 && res.status < 500) || attempt >= 5) return res
    const wait = 5000 * 2 ** attempt // 5s,10s,20s,40s,80s
    console.log(`  …${res.status} on ${label}, waiting ${wait / 1000}s (retry ${attempt + 1}/5)`)
    await sleep(wait)
  }
}

async function uploadFromUrl(url: string): Promise<{ id: string; path: string }> {
  const res = await apiFetch("/upload-from-url", { method: "POST", body: JSON.stringify({ url }) }, "upload")
  if (!res.ok) throw new Error(`upload-from-url ${res.status}: ${await res.text()}`)
  const j = (await res.json()) as { id: string; path: string }
  if (!j.id || !j.path) throw new Error(`upload returned no id/path`)
  return j
}

async function createPin(post: Post, when: Date, type: Args["type"]): Promise<void> {
  const pin = pinFor(post)
  const media = await uploadFromUrl(pin.imageUrl)
  const body = {
    type,
    date: when.toISOString(),
    shortLink: false,
    tags: [],
    posts: [
      {
        integration: { id: PINTEREST_INTEGRATION_ID },
        value: [{ content: pin.description, image: [media] }],
        settings: { __type: "pinterest", title: pin.title, link: pin.link, board: pin.board },
      },
    ],
  }
  const res = await apiFetch("/posts", { method: "POST", body: JSON.stringify(body) }, "create")
  if (!res.ok) throw new Error(`POST /posts ${res.status}: ${await res.text()}`)
}

function scheduleTime(start: Date, index: number, perDay: number): Date {
  const day = Math.floor(index / perDay)
  const slot = index % perDay
  const d = new Date(start)
  d.setDate(d.getDate() + day)
  d.setHours(9 + Math.round((slot * 12) / Math.max(1, perDay)), 0, 0, 0)
  return d
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const ledger = readLedger()

  let posts = loadPosts(args.includeFuture)
  let skippedPinned = 0
  if (args.only) {
    posts = posts.filter((p) => p.slug === args.only)
    if (posts.length === 0) die(`no published post with slug: ${args.only}`)
  } else if (!args.force) {
    const before = posts.length
    posts = posts.filter((p) => !ledger.has(p.slug))
    skippedPinned = before - posts.length
  }
  if (args.limit) posts = posts.slice(0, args.limit)

  const skippedNoImage = posts.filter((p) => !fs.existsSync(pinFor(p).imageFile))
  posts = posts.filter((p) => fs.existsSync(pinFor(p).imageFile))

  console.log(
    `${posts.length} pins to ${args.execute ? `create (type=${args.type})` : "preview (dry-run)"}` +
      (skippedPinned ? `  |  ${skippedPinned} already pinned (ledger)` : "") +
      (skippedNoImage.length ? `  |  ${skippedNoImage.length} no image` : "")
  )
  console.log("")

  const byBoard = new Map<string, number>()
  let pastCount = 0
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]
    const pin = pinFor(p)
    // Run-local slot: pack the posts being pinned this run 5/day from --start.
    let when = scheduleTime(args.start, i, args.perDay)
    // Never pin before the post is live (link would 404) or in the past; bump
    // to a staggered near-future time past that floor.
    const floor = Math.max(new Date(p.publishedAt).getTime() + 3_600_000, Date.now() + 60_000)
    if (when.getTime() < floor) {
      pastCount++
      when = new Date(floor + pastCount * 15 * 60_000)
    }
    byBoard.set(pin.board, (byBoard.get(pin.board) ?? 0) + 1)
    if (!args.execute) {
      console.log(`• ${p.slug}\n    → ${BOARD_NAMES[pin.board]}  |  ${args.type === "draft" ? "draft" : when.toISOString()}`)
      continue
    }
    try {
      await createPin(p, when, args.type)
      ledger.add(p.slug)
      writeLedger(ledger) // persist incrementally so a mid-run failure doesn't lose progress
      console.log(`✓ ${p.slug} → ${BOARD_NAMES[pin.board]} (${args.type})`)
    } catch (err) {
      console.error(`✗ ${p.slug}: ${err instanceof Error ? err.message : err}`)
    }
    await sleep(args.delay) // base pacing between pins to stay under the throttle
  }

  console.log("\n— board distribution —")
  for (const [b, n] of [...byBoard.entries()].sort((a, z) => z[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${BOARD_NAMES[b]}`)
  }
  if (skippedNoImage.length) {
    console.log(`\nNo image (skipped): ${skippedNoImage.map((p) => p.slug).join(", ")}`)
  }
  if (!args.execute) console.log(`\nDry-run. Add --execute --type schedule to create pins.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
