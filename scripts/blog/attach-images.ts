#!/usr/bin/env tsx
/**
 * Copies slide_01.jpg from each slideshow folder to public/blog/<slug>.jpg
 * and inserts `featuredImage` + `featuredImageAlt` into each MDX frontmatter
 * (idempotent — skips posts that already have featuredImage).
 *
 * Usage: npm run blog:attach-images
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..", "..")
const POSTS_DIR = path.join(ROOT, "src", "content", "blog")
const SLIDESHOWS_DIR = path.join(ROOT, "slideshows")
const PUBLIC_BLOG = path.join(ROOT, "public", "blog")

function slugFromFolderName(name: string): string {
  return name.replace(/^\d+_/, "").replace(/_/g, "-")
}

function buildSlideshowIndex(): Map<string, string> {
  // slug → absolute path to slide_01.jpg
  const map = new Map<string, string>()
  const weeks = fs.readdirSync(SLIDESHOWS_DIR, { withFileTypes: true })
  for (const w of weeks) {
    if (!w.isDirectory() || w.name.startsWith(".")) continue
    const weekDir = path.join(SLIDESHOWS_DIR, w.name)
    for (const f of fs.readdirSync(weekDir, { withFileTypes: true })) {
      if (!f.isDirectory() || f.name.startsWith(".")) continue
      const slide = path.join(weekDir, f.name, "images", "slide_01.jpg")
      if (fs.existsSync(slide)) {
        map.set(slugFromFolderName(f.name), slide)
      }
    }
  }
  return map
}

function readFrontmatter(mdx: string): {
  fm: string
  body: string
  hasFeaturedImage: boolean
} {
  if (!mdx.startsWith("---")) {
    throw new Error("File does not start with frontmatter")
  }
  const end = mdx.indexOf("\n---", 4)
  if (end === -1) throw new Error("Frontmatter not terminated")
  const fm = mdx.slice(0, end + 4) // includes closing ---
  const body = mdx.slice(end + 4)
  const hasFeaturedImage = /^featuredImage:/m.test(fm)
  return { fm, body, hasFeaturedImage }
}

function extractTitle(fm: string): string {
  const m = fm.match(/^title:\s*"((?:[^"\\]|\\.)*)"/m)
  return m ? m[1].replace(/\\"/g, '"') : "Featured image"
}

function insertFeaturedImage(
  fm: string,
  imagePath: string,
  alt: string
): string {
  // Insert right after the "author:" line for stable ordering
  const lines = fm.split("\n")
  const authorIdx = lines.findIndex((l) => l.startsWith("author:"))
  const insertAt = authorIdx >= 0 ? authorIdx + 1 : lines.length - 1
  lines.splice(
    insertAt,
    0,
    `featuredImage: "${imagePath}"`,
    `featuredImageAlt: "${alt.replace(/"/g, '\\"')}"`
  )
  return lines.join("\n")
}

function main() {
  if (!fs.existsSync(PUBLIC_BLOG)) fs.mkdirSync(PUBLIC_BLOG, { recursive: true })

  const slideshowIndex = buildSlideshowIndex()
  const mdxFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))

  let copied = 0
  let alreadyHad = 0
  let missing = 0

  for (const file of mdxFiles) {
    const slug = file.replace(/\.mdx$/, "")
    const source = slideshowIndex.get(slug)
    if (!source) {
      console.log(`✗ ${slug}: no matching slide_01.jpg in slideshows/`)
      missing++
      continue
    }

    const destPath = path.join(PUBLIC_BLOG, `${slug}.jpg`)
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(source, destPath)
    }

    const mdxPath = path.join(POSTS_DIR, file)
    const raw = fs.readFileSync(mdxPath, "utf8")
    const { fm, body, hasFeaturedImage } = readFrontmatter(raw)

    if (hasFeaturedImage) {
      console.log(`= ${slug}: image copied; frontmatter already has featuredImage`)
      alreadyHad++
      continue
    }

    const title = extractTitle(fm)
    const newFm = insertFeaturedImage(fm, `/blog/${slug}.jpg`, title)
    fs.writeFileSync(mdxPath, newFm + body, "utf8")
    console.log(`✓ ${slug}: copied image, added featuredImage to frontmatter`)
    copied++
  }

  console.log(
    `\nDone. ${copied} updated, ${alreadyHad} already had image, ${missing} missing source.`
  )
}

main()
