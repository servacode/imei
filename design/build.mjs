// يبني صفحات التصميم الثابتة ويصوّرها بالثيمين الفاتح والغامق.
// الاستخدام: npm run build            (كل الشاشات)
//            npm run build -- web     (مجموعة واحدة)
//            npm run build -- web 01-home,02-location  (شاشات محددة)
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import QRCode from "qrcode";

const root = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const THEMES = ["light", "dark"];

// كل شاشة: المجموعة، والمعرّف، والعنوان، والمقاس، وهل تُصوَّر كاملة
const SCREENS = [
  { group: "web", id: "01-home", title: "الصفحة الرئيسية", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "02-location", title: "الإقناع بتفعيل الموقع قبل الفحص", width: 1440, height: 900 },
  { group: "web", id: "03-result-clean", title: "نتيجة الفحص: لا توجد بلاغات", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "04-result-stolen", title: "نتيجة الفحص: مسروق", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "05-result-lost", title: "نتيجة الفحص: مفقود", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "06-receipt", title: "إيصال الفحص", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "07-register", title: "إنشاء حساب وتأكيد الرقم عبر واتساب", width: 1440, height: 900 },
  { group: "web", id: "08-login", title: "تسجيل الدخول", width: 1440, height: 900 },
  { group: "web", id: "09-verify", title: "التحقق من شهادة أو فاتورة أو إيصال", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "10-protect", title: "احمِ جهازك", width: 1440, height: 900, fullPage: true },
  { group: "web", id: "11-shops", title: "بصمة للمحلات", width: 1440, height: 900, fullPage: true },
];

const GROUP_TITLES = { web: "الموقع" };

function logoMark() {
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="2" width="30" height="44" rx="8" fill="var(--brand-500)"/><rect x="20" y="6" width="8" height="2" rx="1" fill="#fff" opacity=".65"/><g fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round"><path d="M14.5 31v-4a9.5 9.5 0 0 1 19 0v1.5"/><path d="M18 36v-9a6 6 0 0 1 12 0v5"/><path d="M21.5 39.5V27a2.5 2.5 0 0 1 5 0v8"/><path d="M33.2 33.5c-.3 1.7-.8 3.2-1.5 4.6"/></g></svg>`;
}
function logo(withTag = true) {
  return `<span class="logo">${logoMark()}<span>بصمة${withTag ? '<span class="tag">اعرف حقيقة أي جهاز</span>' : ""}</span></span>`;
}

const iconCache = new Map();
async function icon(name, extra = "") {
  if (!iconCache.has(name)) {
    const file = path.join(root, "node_modules/lucide-static/icons", `${name}.svg`);
    const svg = await fs.readFile(file, "utf8").catch(() => {
      throw new Error(`أيقونة غير موجودة: ${name}`);
    });
    const clean = svg.replace(/<!--[\s\S]*?-->/g, "").trim();
    // نحذف المقاس والصنف من وسم svg الجذر فقط، لا من العناصر الداخلية
    iconCache.set(name, clean.replace(/<svg[^>]*>/, (tag) => tag.replace(/\s(width|height|class)="[^"]*"/g, "")));
  }
  return iconCache.get(name).replace("<svg", `<svg class="ic ${extra}"`);
}

async function qr(text) {
  return QRCode.toString(text, { type: "svg", margin: 0, color: { dark: "#13201A", light: "#FFFFFF" } });
}

async function replaceAsync(str, re, fn) {
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(re)) {
    parts.push(str.slice(last, m.index), await fn(...m));
    last = m.index + m[0].length;
  }
  parts.push(str.slice(last));
  return parts.join("");
}

async function render(html, depth = 0) {
  if (depth > 5) throw new Error("تداخل زائد في الأجزاء");
  html = await replaceAsync(html, /\{\{>\s*([a-z0-9-]+)\s*\}\}/g, async (_, name) =>
    render(await fs.readFile(path.join(root, "src/partials", `${name}.html`), "utf8"), depth + 1));
  html = await replaceAsync(html, /\{\{icon ([a-z0-9-]+)(?: ([^}]+))?\}\}/g, (_, n, extra) => icon(n, extra || ""));
  html = await replaceAsync(html, /\{\{qr ([^}]+)\}\}/g, (_, t) => qr(t.trim()));
  html = html.replace(/\{\{logo-mark\}\}/g, logoMark()).replace(/\{\{logo-plain\}\}/g, logo(false)).replace(/\{\{logo\}\}/g, logo());
  return html;
}

function wrap(body, group) {
  return `<!doctype html><html lang="ar" dir="rtl" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="../../styles/tokens.css"><link rel="stylesheet" href="../../styles/components.css"><link rel="stylesheet" href="../../styles/${group}.css"></head><body>${body}</body></html>`;
}

async function main() {
  const only = process.argv[2];
  const ids = process.argv[3] ? process.argv[3].split(",") : null;
  const screens = SCREENS.filter((s) => (!only || s.group === only) && (!ids || ids.includes(s.id)));
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox", "--font-render-hinting=none"] });
  const page = await browser.newPage();
  for (const s of screens) {
    const src = await fs.readFile(path.join(root, "src", s.group, `${s.id}.html`), "utf8");
    const out = path.join(root, "dist", s.group, `${s.id}.html`);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, wrap(await render(src), s.group));
    for (const theme of THEMES) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.goto(pathToFileURL(out).href);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.evaluate(() => document.fonts.ready);
      const png = path.join(root, "screens", s.group, theme, `${s.id}.png`);
      await fs.mkdir(path.dirname(png), { recursive: true });
      await page.screenshot({ path: png, fullPage: !!s.fullPage });
      console.log("✓", s.group, theme, s.id);
    }
  }
  await browser.close();
  await writeGallery();
}

async function writeGallery() {
  const groups = [...new Set(SCREENS.map((s) => s.group))];
  let md = "# تصاميم الشاشات — بصمة\n\n";
  md += "> صور تصميم ثابتة للعرض، وليست برمجة للمنصة. كل شاشة بالثيمين الفاتح والغامق، ومبنية على [الهوية البصرية](../docs/15-visual-identity.md) ورموز التصميم المركزية في `styles/tokens.css`.\n\n";
  md += "لإعادة التوليد: `cd design && npm install && npm run build`\n\n";
  for (const g of groups) {
    md += `## ${GROUP_TITLES[g] || g}\n\n`;
    for (const s of SCREENS.filter((x) => x.group === g)) {
      md += `### ${s.title}\n\n| فاتح | غامق |\n|---|---|\n| ![${s.title} — فاتح](screens/${g}/light/${s.id}.png) | ![${s.title} — غامق](screens/${g}/dark/${s.id}.png) |\n\n`;
    }
  }
  await fs.writeFile(path.join(root, "README.md"), md);
}

main().catch((e) => { console.error(e); process.exit(1); });
