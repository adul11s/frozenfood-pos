// Records a ~55s POS tour of the live Bios Frozen Food app.
// Usage: node scripts/demo-video.mjs [baseURL]
// Writes demo-output/ frames + docs/media/demo.webm (converted to mp4/gif separately).

import { chromium } from "@playwright/test";
import { mkdirSync, renameSync } from "node:fs";

const BASE = process.argv[2] ?? process.env.DEMO_BASE_URL ?? "https://frozenfood-pos.vercel.app";
const OUT = "demo-output";
const wait = (page, ms) => page.waitForTimeout(ms);

async function step(page, label, fn) {
  const t = Date.now();
  try {
    await fn();
    console.log(`ok   ${label} (${Math.round((Date.now() - t) / 1000)}s)`);
  } catch (err) {
    console.log(`skip ${label}: ${err.message.split("\n")[0]}`);
  }
}

const CURSOR_JS = () => {
  const dot = document.createElement("div");
  dot.style.cssText =
    "position:fixed;z-index:2147483647;width:14px;height:14px;border-radius:50%;" +
    "background:rgba(56,189,248,.9);box-shadow:0 0 0 4px rgba(56,189,248,.25);" +
    "pointer-events:none;transform:translate(-50%,-50%);transition:width .1s,height .1s;left:-40px;top:-40px";
  document.documentElement.appendChild(dot);
  window.addEventListener("mousemove", (e) => {
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
  }, true);
  window.addEventListener("mousedown", () => { dot.style.width = "22px"; dot.style.height = "22px"; }, true);
  window.addEventListener("mouseup", () => { dot.style.width = "14px"; dot.style.height = "14px"; }, true);
};

async function glide(page, x, y) {
  await page.mouse.move(x, y, { steps: 12 });
  await wait(page, 300);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 420, height: 860 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: 420, height: 860 } },
    locale: "id-ID",
  });
  await context.addInitScript(CURSOR_JS);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await step(page, "login screen", async () => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await wait(page, 3000);
    await glide(page, 210, 380);
  });

  await step(page, "login admin", async () => {
    await page.getByPlaceholder(/username/i).fill("admin");
    await wait(page, 400);
    await page.getByPlaceholder(/password/i).fill("admin123");
    await wait(page, 400);
    await glide(page, 210, 520);
    await page.getByRole("button", { name: /masuk|login/i }).click();
    await wait(page, 4500);
  });

  await step(page, "dashboard", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await wait(page, 3500);
    await page.mouse.wheel(0, 420);
    await wait(page, 2200);
    await page.mouse.wheel(0, -420);
    await wait(page, 800);
  });

  await step(page, "kasir", async () => {
    await page.goto(`${BASE}/sales`, { waitUntil: "domcontentloaded" });
    await wait(page, 3200);
    await page.mouse.wheel(0, 300);
    await wait(page, 2000);
  });

  await step(page, "produk", async () => {
    await page.goto(`${BASE}/products`, { waitUntil: "domcontentloaded" });
    await wait(page, 3000);
    await page.mouse.wheel(0, 320);
    await wait(page, 2000);
  });

  await step(page, "stock", async () => {
    await page.goto(`${BASE}/stock`, { waitUntil: "domcontentloaded" });
    await wait(page, 2600);
    await page.mouse.wheel(0, 260);
    await wait(page, 1600);
  });

  await step(page, "laporan", async () => {
    await page.goto(`${BASE}/report`, { waitUntil: "domcontentloaded" });
    await wait(page, 3200);
    await page.mouse.wheel(0, 300);
    await wait(page, 2000);
  });

  await step(page, "pengaturan", async () => {
    await page.goto(`${BASE}/setting`, { waitUntil: "domcontentloaded" });
    await wait(page, 2600);
    await page.mouse.wheel(0, 300);
    await wait(page, 1600);
  });

  await step(page, "closing", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await wait(page, 2200);
  });

  const video = page.video();
  await context.close();
  await browser.close();
  const tmp = await video.path();
  mkdirSync("docs/media", { recursive: true });
  renameSync(tmp, "docs/media/demo.webm");
  console.log("saved docs/media/demo.webm");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
