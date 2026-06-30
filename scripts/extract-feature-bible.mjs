#!/usr/bin/env node
/**
 * Extracts the Social Media Feature Bible markdown into a structured JSON
 * registry consumed by the Wakka Wakka site (Feature Hub + category pages).
 *
 * Parses three sections:
 *   3. Master Combined Feature List   -> 1082 features
 *   4. Feature Improvement Proposals  -> 1082 Wakka Wakka enhancements
 *   5. 100+ Unique Innovations        -> 100 innovations
 *
 * Features and improvements are aligned by category + ordinal and merged.
 * Output: src/data/featureBible.json
 *
 * Run: node scripts/extract-feature-bible.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'social_media_feature_bible.md');
const OUT = resolve(ROOT, 'src/data/featureBible.json');

const raw = readFileSync(SRC, 'utf8');
const lines = raw.split('\n');

// ---- Locate the three top-level sections (## 3., ## 4., ## 5.) ----
function findLine(re, from = 0) {
  for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
}
const sec3 = findLine(/^## 3\. Master Combined Feature List/);
const sec4 = findLine(/^## 4\. Feature Improvement Proposals/);
const sec5 = findLine(/^## 5\. .*Unique Innovations/);
if (sec3 < 0 || sec4 < 0 || sec5 < 0) {
  throw new Error(`Could not locate sections: sec3=${sec3} sec4=${sec4} sec5=${sec5}`);
}

const CATEGORIES = [
  'Content Creation & Editing',
  'Content Discovery & Search',
  'Interpersonal & Community Engagement',
  'Direct Messaging & Communication',
  'Monetization & E-Commerce',
  'Analytics, Business & Creator Tools',
  'Privacy, Security & Safety',
  'Developer APIs & Integrations',
  'Notifications & Time Management',
  'Account Settings & Authentication',
];

// slugify category for routing / ids
function catSlug(cat) {
  return cat.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function slug(s) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

// Generic block parser: within [start,end), split into category groups by
// "### Category: X", then into entries by "#### N. Title". Returns map of
// bullet fields per entry plus title/ordinal/category.
function parseSection(start, end) {
  const groups = {}; // category -> [entries]
  let currentCat = null;
  let entry = null;
  const flush = () => {
    if (entry && currentCat) {
      (groups[currentCat] = groups[currentCat] || []).push(entry);
    }
    entry = null;
  };
  for (let i = start; i < end; i++) {
    const ln = lines[i];
    const mCat = ln.match(/^### Category:\s*(.+?)\s*$/);
    if (mCat) {
      flush();
      currentCat = mCat[1];
      continue;
    }
    const mEntry = ln.match(/^#### (\d+)\.\s*(.+?)\s*$/);
    if (mEntry) {
      flush();
      entry = { ordinal: Number(mEntry[1]), title: mEntry[2], fields: {} };
      continue;
    }
    const mField = ln.match(/^-\s*\*\*(.+?)\*\*:\s*(.*)$/);
    if (mField && entry) {
      entry.fields[mField[1].trim()] = mField[2].trim();
    }
  }
  flush();
  return groups;
}

const featGroups = parseSection(sec3, sec4);
const impGroups = parseSection(sec4, sec5);
// Innovations section: stop at "### Methodology" if present
let innoEnd = findLine(/^### Methodology/, sec5);
if (innoEnd < 0) innoEnd = lines.length;
const innoGroups = parseSection(sec5, innoEnd);

// ---- Merge features with improvements by category + ordinal ----
const features = [];
let totalFeat = 0;
let totalImp = 0;
for (const cat of CATEGORIES) {
  const feats = featGroups[cat] || [];
  const imps = impGroups[cat] || [];
  // improvement titles are "Wakka Wakka Improvement: <name>"
  const impByOrdinal = new Map();
  for (const im of imps) impByOrdinal.set(im.ordinal, im);
  for (const f of feats) {
    totalFeat++;
    const im = impByOrdinal.get(f.ordinal);
    if (im) totalImp++;
    features.push({
      id: `${catSlug(cat)}--f${f.ordinal}--${slug(f.title)}`,
      ordinal: f.ordinal,
      category: cat,
      categorySlug: catSlug(cat),
      title: f.title,
      description: f.fields['Description'] || '',
      platforms: (f.fields['Implementing Platforms'] || '')
        .split(',').map(s => s.trim()).filter(Boolean),
      originalNames: f.fields['Original Name(s)'] || '',
      enhancement: im ? im.fields['Wakka Wakka Enhancement'] || '' : '',
      whyItMatters: im ? im.fields['Why It Matters'] || '' : '',
    });
  }
}

// ---- Innovations ----
const innovations = [];
for (const cat of CATEGORIES) {
  const items = innoGroups[cat] || [];
  for (const it of items) {
    innovations.push({
      id: `${catSlug(cat)}--i${it.ordinal}--${slug(it.title)}`,
      ordinal: it.ordinal,
      category: cat,
      categorySlug: catSlug(cat),
      title: it.title,
      description: it.fields['Description'] || '',
      impact: it.fields['Impact Rating'] || 'Medium',
    });
  }
}

// ---- Category summary ----
const categories = CATEGORIES.map((cat, idx) => ({
  index: idx + 1,
  name: cat,
  slug: catSlug(cat),
  featureCount: features.filter(f => f.category === cat).length,
  innovationCount: innovations.filter(i => i.category === cat).length,
}));

const out = {
  generatedAt: new Date().toISOString(),
  totals: {
    features: features.length,
    improvements: totalImp,
    innovations: innovations.length,
  },
  categories,
  features,
  innovations,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log('Extraction complete:');
console.log(`  features:     ${features.length} (expected 1082)`);
console.log(`  improvements: ${totalImp} (merged onto features; expected 1082)`);
console.log(`  innovations:  ${innovations.length} (expected 100)`);
console.log('  by category:');
for (const c of categories) {
  console.log(`    ${String(c.index).padStart(2)}. ${c.name}: ${c.featureCount} features, ${c.innovationCount} innovations`);
}
console.log(`  -> ${OUT}`);
