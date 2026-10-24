// Generates deterministic SVG placeholder images for demo products so that
// product image URLs never break. Run with: node scripts/generate-images.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images", "products");

const slugs = [
  "nakshi-kantha-bed-cover",
  "traditional-nakshi-kantha-throw",
  "cotton-quilt-kantha-lep",
  "kantha-stitch-cushion-cover",
  "jamdani-cotton-saree",
  "soft-silk-saree",
  "embroidered-salwar-kameez",
  "cotton-three-piece-set",
  "mens-cotton-panjabi",
  "mens-casual-shirt",
  "kids-cotton-t-shirt",
  "kids-cotton-frock",
  "herbal-face-wash",
  "aloe-vera-face-cream",
  "matte-lipstick-set",
  "herbal-hair-oil",
  "natural-herbal-shampoo",
  "cotton-bed-sheet-set",
  "stainless-steel-cookware-set",
  "non-stick-fry-pan",
  "hand-painted-ceramic-vase",
  "bamboo-table-lamp",
];

const palette = [
  ["#0f766e", "#5eead4"],
  ["#b45309", "#fcd34d"],
  ["#9d174d", "#f9a8d4"],
  ["#4338ca", "#a5b4fc"],
  ["#be123c", "#fda4af"],
  ["#166534", "#86efac"],
  ["#7c2d12", "#fdba74"],
  ["#1e3a8a", "#93c5fd"],
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function label(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  const [c1, c2] = palette[hash(slug) % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="${label(slug)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="320" cy="90" r="60" fill="rgba(255,255,255,0.15)"/>
  <circle cx="70" cy="330" r="80" fill="rgba(255,255,255,0.12)"/>
  <rect x="80" y="150" width="240" height="120" rx="12" fill="rgba(255,255,255,0.18)"/>
  <text x="200" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="#ffffff">${label(slug)}</text>
</svg>
`;
  writeFileSync(join(outDir, `${slug}.svg`), svg, "utf8");
}

console.log(`Generated ${slugs.length} product images in ${outDir}`);
