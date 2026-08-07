import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "temporary screenshots");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function nextIndex() {
  const files = fs.readdirSync(OUT_DIR).filter((f) => /^screenshot-(\d+)/.test(f));
  const nums = files.map((f) => parseInt(f.match(/^screenshot-(\d+)/)[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";
const width = parseInt(process.argv[4] || "1440", 10);
const height = parseInt(process.argv[5] || "900", 10);
const fullPage = process.argv[6] !== "false";

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 300));

// Scroll through the page so scroll-reveal / IntersectionObserver animations
// and counters trigger before the full-page screenshot is captured.
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
const step = Math.round(height * 0.85);
for (let y = 0; y < scrollHeight; y += step) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 220));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 500));

const idx = nextIndex();
const suffix = label ? `-${label}` : "";
const fileName = `screenshot-${idx}${suffix}.png`;
const filePath = path.join(OUT_DIR, fileName);

await page.screenshot({ path: filePath, fullPage });
await browser.close();

console.log(`Saved: ${filePath}`);
