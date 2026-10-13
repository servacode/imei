// يولّد ملفات الرموز من styles/tokens.json، ثم يبني صفحات التصميم الثابتة ويصوّرها بالثيمين الفاتح والغامق.
// الاستخدام: node design/build.mjs                       (الرموز ثم كل الشاشات)
//            node design/build.mjs tokens                (توليد الرموز وفحص التطابق فقط)
//            node design/build.mjs web                   (مجموعة واحدة)
//            node design/build.mjs web 01-home,02-location  (شاشات محددة)
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
  { group: "brand", id: "01-identity", title: "لوحة الهوية البصرية", width: 1440, height: 900, fullPage: true },
  { group: "lifecycle", id: "01-overview", title: "الدورة الكاملة لحياة الجهاز", width: 1440, height: 900, fullPage: true },
  { group: "lifecycle", id: "02-report-journey", title: "رحلة البلاغ من التقديم حتى الاسترداد", width: 1440, height: 900, fullPage: true },
  { group: "lifecycle", id: "03-alerts", title: "مسار الرصد والتنبيهات", width: 1440, height: 900, fullPage: true },
];

const GROUP_TITLES = {
  brand: "الهوية البصرية",
  lifecycle: "الدورة التشغيلية",
  web: "الموقع",
  app: "التطبيق (آيفون وأندرويد)",
  shop: "لوحة المحل والوكيل على الموقع",
  admin: "لوحة الإدارة",
  police: "بوابة قوى الأمن",
};

// الشاشات الجديدة تُكتشف تلقائياً من src/<group>/*.html، وفي أول سطر منها:
// <!-- meta: {"title":"...","width":1440,"height":900,"fullPage":true} -->
async function discover() {
  const found = [];
  for (const group of Object.keys(GROUP_TITLES)) {
    const dir = path.join(root, "src", group);
    const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith(".html")).sort();
    for (const f of files) {
      const id = f.replace(/\.html$/, "");
      if (SCREENS.some((s) => s.group === group && s.id === id)) continue;
      const head = (await fs.readFile(path.join(dir, f), "utf8")).slice(0, 400);
      const m = head.match(/<!--\s*meta:\s*(\{[\s\S]*?\})\s*-->/);
      if (!m) continue;
      found.push({ group, id, width: 1440, height: 900, ...JSON.parse(m[1]) });
    }
  }
  SCREENS.push(...found);
}


// ————————————————————————————————————————————————
// الرموز: styles/tokens.json هو المصدر الوحيد. منه تُولَّد:
//   styles/tokens.css        متغيرات CSS للويب واللوحات (والـ alias يصبح var() ليسري تغيير اللون الأساسي)
//   styles/status.css        أصناف فئات الحالات (pill/a-badge/badge/tone-*) من سجل الفئات
//   styles/tokens.native.json  القيم المحلولة للتطبيق (React Native): px وms أرقام
// وأي تعديل يدوي على الملفات المولّدة يُكتب فوقه في البناء التالي.
// ————————————————————————————————————————————————
const FONT_FACES = [400, 500, 600, 700].flatMap((w) => [
  `@font-face { font-family: "Plex Arabic"; font-weight: ${w}; src: url("../assets/fonts/ibm-plex-sans-arabic-arabic-${w}-normal.woff2") format("woff2"); unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+2010-2011; }`,
  `@font-face { font-family: "Plex Arabic"; font-weight: ${w}; src: url("../assets/fonts/ibm-plex-sans-arabic-latin-${w}-normal.woff2") format("woff2"); unicode-range: U+0000-00FF, U+2000-206F, U+20AC, U+2122, U+2190-21FF; }`,
]);
const CSS_SKIP_GROUPS = new Set(["type-app"]); // أحجام التطبيق بالنقاط، لا تخص CSS

function leaves(group) {
  const out = [];
  for (const [k, v] of Object.entries(group || {})) {
    if (k.startsWith("$")) continue;
    if (v && typeof v === "object" && "$value" in v) out.push([k, v]);
  }
  return out;
}
function groups(set) {
  return Object.entries(set || {}).filter(([k]) => !k.startsWith("$"));
}
function cssValue(tok) {
  const alias = tok.$extensions?.basma?.alias;
  return alias ? `var(--${alias})` : String(tok.$value);
}
function nativeValue(tok) {
  const v = tok.$value;
  if (typeof v === "string" && /^-?\d+(\.\d+)?(px|ms)$/.test(v)) return Number(v.replace(/(px|ms)$/, ""));
  if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

async function generateTokens() {
  const src = JSON.parse(await fs.readFile(path.join(root, "styles/tokens.json"), "utf8"));
  const head = "/* ملف مولَّد من styles/tokens.json بالأمر: node design/build.mjs tokens — لا تعدّله يدوياً (docs/15 §20). */\n";
  const block = (sets) => sets.flatMap(([name, g]) => (CSS_SKIP_GROUPS.has(name) ? [] : leaves(g).map(([k, t]) => `  --${k}: ${cssValue(t)};`)));
  const coreLines = block(groups(src.core));
  const lightLines = block(groups(src.light));
  const darkLines = block(groups(src.dark));
  // التطابق: كل رمز في الفاتح له مقابل في الغامق والعكس
  const names = (set) => new Set(groups(set).flatMap(([, g]) => leaves(g).map(([k]) => k)));
  const L = names(src.light), D = names(src.dark);
  const missing = [...[...L].filter((k) => !D.has(k)).map((k) => `dark:${k}`), ...[...D].filter((k) => !L.has(k)).map((k) => `light:${k}`)];
  if (missing.length) throw new Error("رموز بلا مقابل في الثيم الآخر: " + missing.join("، "));
  const css = [
    head,
    FONT_FACES.join("\n"),
    "",
    ":root {",
    "  /* — ثابتة في الثيمين — */",
    ...coreLines,
    "  /* — الثيم الفاتح — */",
    ...lightLines,
    "  color-scheme: light;",
    "}",
    "",
    ':root[data-theme="dark"] {',
    ...darkLines,
    "  color-scheme: dark;",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  :root { --dur-fast: var(--dur-reduced); --dur-base: var(--dur-reduced); --dur-slow: var(--dur-reduced); }",
    "}",
    "",
  ].join("\n");
  await fs.writeFile(path.join(root, "styles/tokens.css"), css);

  // سجل فئات الحالات → أصناف CSS
  const cats = Object.entries(src.status).filter(([k]) => !k.startsWith("$"));
  for (const [k, c] of cats) {
    for (const ref of ["fg", "bg", "border", "on"]) if (!L.has(c.$value[ref])) throw new Error(`فئة ${k}: الرمز ${c.$value[ref]} غير معرّف`);
  }
  const statusCss = [
    head,
    "/* كل فئة حالة تضبط أربعة متغيرات، والمكوّنات (.pill و.a-badge و.badge و.tone-*) تقرؤها. */",
    ...cats.map(([k, c]) => `.tone-${k}, .pill.${k}, .a-badge.${k}, .badge-${k} { --tone-fg: var(--${c.$value.fg}); --tone-bg: var(--${c.$value.bg}); --tone-bd: var(--${c.$value.border}); --tone-on: var(--${c.$value.on}); }`),
    "",
  ].join("\n");
  await fs.writeFile(path.join(root, "styles/status.css"), statusCss);

  // التطبيق: قيم محلولة لكل ثيم
  const flat = (set) => Object.fromEntries(groups(set).flatMap(([, g]) => leaves(g).map(([k, t]) => [k, nativeValue(t)])));
  const native = {
    $description: "مولَّد من styles/tokens.json للتطبيق (React Native). القيم محلولة، والأبعاد أرقام بالنقطة (iOS) أو dp (أندرويد). لا تعدّله يدوياً.",
    version: src.$extensions?.basma?.version,
    core: flat(src.core),
    light: flat(src.light),
    dark: flat(src.dark),
    status: Object.fromEntries(cats.map(([k, c]) => [k, { ...c.$value, meaning: c.$description }])),
    runtimeOverridable: src.$extensions?.basma?.runtimeOverridable,
  };
  await fs.writeFile(path.join(root, "styles/tokens.native.json"), JSON.stringify(native, null, 2) + "\n");
  console.log(`✓ الرموز: ${coreLines.length} ثابتة، ${lightLines.length} لكل ثيم، ${cats.length} فئات حالة`);
  return src;
}

let TOKENS = null;
async function statusRegistry() {
  const src = TOKENS || JSON.parse(await fs.readFile(path.join(root, "styles/tokens.json"), "utf8"));
  const light = Object.fromEntries(groups(src.light).flatMap(([, g]) => leaves(g).map(([k, t]) => [k, t.$value])));
  const dark = Object.fromEntries(groups(src.dark).flatMap(([, g]) => leaves(g).map(([k, t]) => [k, t.$value])));
  const rows = [];
  for (const [k, c] of Object.entries(src.status).filter(([k]) => !k.startsWith("$"))) {
    const v = c.$value;
    const label = c.$extensions?.basma?.designLabel || k;
    const ic = await icon(v.icon);
    rows.push(`<tr><td><code>${k}</code>${v.reservedForDevice ? ' <span class="pill tone-info" style="font-size:11px">للجهاز فقط</span>' : ""}</td>` +
      `<td><span class="pill ${k}">${ic} ${label}</span></td>` +
      `<td><span class="pill solid ${k}">${ic} ${label}</span></td>` +
      `<td><span class="pill outline ${k}">${ic} ${label}</span></td>` +
      `<td><span class="pill dot ${k}">${label}</span></td>` +
      `<td class="reg-hex"><span class="sw-dot" style="background:${light[v.fg]}"></span><span class="ltr">${light[v.fg]}</span> · <span class="sw-dot" style="background:${dark[v.fg]}"></span><span class="ltr">${dark[v.fg]}</span></td>` +
      `<td><code>${v.icon}</code></td><td class="small">${c.$description}</td></tr>`);
  }
  return `<table class="tbl reg-tbl"><thead><tr><th>الفئة</th><th>ناعمة (الافتراضية)</th><th>صلبة</th><th>محدّدة</th><th>نقطة</th><th>اللون فاتح · غامق</th><th>الأيقونة</th><th>متى تُستخدم</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

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
  if (html.includes("{{status-registry}}")) html = html.replace(/\{\{status-registry\}\}/g, await statusRegistry());
  html = html.replace(/\{\{logo-mark\}\}/g, logoMark()).replace(/\{\{logo-plain\}\}/g, logo(false)).replace(/\{\{logo\}\}/g, logo());
  return html;
}

const PANEL_GROUPS = ["shop", "admin", "police", "brand"]; // لوحات الهوية تستعمل مكوّنات اللوحات (الجداول والشارات)
function wrap(body, group) {
  const sheets = ["tokens", "components", "status", ...(PANEL_GROUPS.includes(group) ? ["panel"] : []), group];
  const links = sheets.map((s) => `<link rel="stylesheet" href="../../styles/${s}.css">`).join("");
  return `<!doctype html><html lang="ar" dir="rtl" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${links}</head><body>${body}</body></html>`;
}

async function main() {
  TOKENS = await generateTokens();
  if (process.argv[2] === "tokens") return;
  await discover();
  const only = process.argv[2];
  const ids = process.argv[3] ? process.argv[3].split(",") : null;
  const screens = SCREENS.filter((s) => (!only || s.group === only) && (!ids || ids.includes(s.id)));
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox", "--font-render-hinting=none"] });
  const page = await browser.newPage();
  for (const s of screens) {
    const src = await fs.readFile(path.join(root, "src", s.group, `${s.id}.html`), "utf8");
    const out = path.join(root, "dist", s.group, `${s.id}.html`);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, wrap(await render(src.replace(/^<!--\s*meta:[\s\S]*?-->\s*/, "")), s.group));
    for (const theme of THEMES) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.goto(pathToFileURL(out).href);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; window.__afterTheme && window.__afterTheme(); }, theme);
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
  const groups = Object.keys(GROUP_TITLES).filter((g) => SCREENS.some((s) => s.group === g));
  // الجزء اليدوي من README (فوق العلامة) يبقى كما هو، والمعرض تحته يُولَّد في كل بناء
  const MARK = "<!-- gallery:start — ما تحت هذا السطر مولَّد من build.mjs -->";
  const old = await fs.readFile(path.join(root, "README.md"), "utf8").catch(() => "");
  let md = old.includes(MARK) ? old.slice(0, old.indexOf(MARK)) : "# تصاميم الشاشات ونظام التصميم — بصمة\n\n";
  md += MARK + "\n\n# معرض الشاشات\n\n";
  for (const g of groups) {
    md += `## ${GROUP_TITLES[g] || g}\n\n`;
    for (const s of SCREENS.filter((x) => x.group === g)) {
      md += `### ${s.title}\n\n| فاتح | غامق |\n|---|---|\n| ![${s.title} — فاتح](screens/${g}/light/${s.id}.png) | ![${s.title} — غامق](screens/${g}/dark/${s.id}.png) |\n\n`;
    }
  }
  const diagrams = await fs.readdir(path.join(root, "screens/lifecycle/diagrams")).catch(() => []);
  const DIAGRAM_TITLES = {
    "01-overview": "الصورة الكاملة (14 §1)", "02-device-states": "حالات الجهاز (14 §2)", "03-report-flow": "البلاغ من التقديم حتى الإغلاق (14 §3)",
    "04-alerts": "مسار الرصد والتنبيهات (14 §4)", "05-account": "الحساب (14 §5.1)", "06-shop": "المحل والوكيل (14 §5.2)",
    "07-telecom": "الجهاز على شبكات الاتصالات (14 §5.3)", "08-self-registration": "التسجيل الذاتي (14 §5.4)", "09-succession": "انتقال جهاز المتوفى (14 §5.5)",
    "10-seized": "الجهاز المضبوط (14 §5.6)", "11-repair": "أمر الصيانة (14 §5.7)",
  };
  if (diagrams.length) {
    md += "## مخططات الدورة التشغيلية التفصيلية\n\n> مولَّدة من مخططات Mermaid في [الدورة التشغيلية](../docs/14-operational-lifecycle.md) (الطريقة في أعلى هذا الملف).\n\n";
    for (const f of diagrams.sort()) {
      const t = DIAGRAM_TITLES[f.replace(/\.png$/, "")] || f;
      md += `### ${t}\n\n![${t}](screens/lifecycle/diagrams/${f})\n\n`;
    }
  }
  await fs.writeFile(path.join(root, "README.md"), md);
}

main().catch((e) => { console.error(e); process.exit(1); });
