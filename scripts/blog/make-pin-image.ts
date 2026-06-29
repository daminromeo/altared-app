#!/usr/bin/env tsx
/**
 * Generates a branded 1000x1500 (2:3) Pinterest pin image for the Hidden-Cost
 * Report, using the brand fonts (Playfair Display + DM Sans) and palette.
 * Output: public/blog/wedding-hidden-cost-report-2026.jpg
 *
 * Usage: npm run blog:make-pin-image
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..", "..")

const W = 1000
const H = 1500
const FONTS = path.join(__dirname, "assets", "fonts")
const BG = path.join(ROOT, "public", "blog", "before-first-venue-tour.jpg")
const OUT = path.join(ROOT, "public", "blog", "wedding-hidden-cost-report-2026.jpg")

// Brand palette
const WHITE = "#FAF8F5"
const GOLD = "#C9A96E"

GlobalFonts.registerFromPath(path.join(FONTS, "PlayfairDisplay.ttf"), "Playfair Display")
GlobalFonts.registerFromPath(path.join(FONTS, "DMSans.ttf"), "DM Sans")

function drawCover(ctx: any, img: any) {
  const scale = Math.max(W / img.width, H / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
}

// Center text; returns the y of the next line.
function centerText(
  ctx: any,
  text: string,
  y: number,
  font: string,
  color: string,
  spacing = 0
) {
  ctx.font = font
  ctx.fillStyle = color
  if (!spacing) {
    ctx.textAlign = "center"
    ctx.fillText(text, W / 2, y)
    return
  }
  // manual letter-spacing
  ctx.textAlign = "left"
  const widths = [...text].map((c) => ctx.measureText(c).width + spacing)
  const total = widths.reduce((a, b) => a + b, 0) - spacing
  let x = (W - total) / 2
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, y)
    x += widths[i]
  }
}

function wrap(ctx: any, text: string, font: string, maxWidth: number): string[] {
  ctx.font = font
  const words = text.split(" ")
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur)
      cur = w
    } else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}

async function main() {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext("2d")

  // Background image, cover-fit
  drawCover(ctx, await loadImage(BG))

  // Dark legibility gradient (subtle top, heavy bottom)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, "rgba(20,18,16,0.55)")
  g.addColorStop(0.42, "rgba(20,18,16,0.32)")
  g.addColorStop(0.72, "rgba(20,18,16,0.62)")
  g.addColorStop(1, "rgba(20,18,16,0.9)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Wordmark
  centerText(ctx, "ALTARED", 120, '600 34px "Playfair Display"', WHITE, 10)

  // Kicker
  centerText(ctx, "2026 REPORT", 690, '600 24px "DM Sans"', GOLD, 8)

  // Headline (Playfair), wrapped
  const headFont = '700 82px "Playfair Display"'
  const headLines = wrap(ctx, "The Wedding Hidden-Cost Report", headFont, W - 140)
  let y = 690 + 92
  for (const line of headLines) {
    centerText(ctx, line, y, headFont, WHITE)
    y += 92
  }

  // Thin gold divider
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - 70, y + 6)
  ctx.lineTo(W / 2 + 70, y + 6)
  ctx.stroke()

  // Stat callout
  centerText(ctx, "$3,600–$4,800", y + 110, '700 70px "Playfair Display"', GOLD)
  const sub = wrap(
    ctx,
    "in venue service charges alone — and it's not a tip.",
    '400 30px "DM Sans"',
    W - 220
  )
  let sy = y + 165
  for (const line of sub) {
    centerText(ctx, line, sy, '400 30px "DM Sans"', WHITE)
    sy += 42
  }

  // Footer
  centerText(ctx, "altared.app", 1420, '600 40px "Playfair Display"', GOLD)

  const jpg = await canvas.encode("jpeg", 90)
  fs.writeFileSync(OUT, jpg)
  console.log(`✓ wrote ${path.relative(ROOT, OUT)} (${W}x${H}, ${(jpg.length / 1024).toFixed(0)}KB)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
