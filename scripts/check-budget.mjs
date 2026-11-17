// Weighs the first load of the site's main pages (in the default look) and fails if any page goes
// over its budget in scripts/budget.json: HTML, scripts, styles, fonts, images and the total, in
// compressed bytes as sent. Bytes, not timings: they don't change between runs, so a red check
// means a page really got heavier.
//
//   BASE_URL=http://localhost:3000 node scripts/check-budget.mjs           check against the budget
//   BASE_URL=http://localhost:3000 node scripts/check-budget.mjs --measure  print sizes only
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const measureOnly = process.argv.includes('--measure');
const budget = JSON.parse(readFileSync('scripts/budget.json', 'utf8'));
const KINDS = { document: 'html', script: 'js', stylesheet: 'css', font: 'fonts', image: 'images' };

const browser = await chromium.launch();
const kb = (bytes) => Math.round(bytes / 1024);
const failures = [];
const rows = [];

for (const path of Object.keys(budget.pages)) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const sizes = { html: 0, js: 0, css: 0, fonts: 0, images: 0, other: 0 };
  const pending = [];
  page.on('requestfinished', (request) => {
    pending.push(
      request.sizes().then((s) => {
        const kind = KINDS[request.resourceType()] ?? 'other';
        sizes[kind] += s.responseBodySize + s.responseHeadersSize;
      })
    );
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await Promise.all(pending);
  await context.close();

  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  const measured = { ...sizes, total };
  rows.push(`${path.padEnd(14)} ${Object.entries(measured).map(([k, v]) => `${k} ${kb(v)}`).join('  ')} (KB)`);
  for (const [kind, limitKb] of Object.entries(budget.pages[path])) {
    if (kb(measured[kind]) > limitKb) failures.push(`${path}: ${kind} is ${kb(measured[kind])} KB, over its ${limitKb} KB budget`);
  }
}
await browser.close();

console.log(rows.join('\n'));
if (!measureOnly && failures.length) {
  console.error(`\nOver budget:\n- ${failures.join('\n- ')}\n\nIf the growth is intended, raise the numbers in scripts/budget.json in the same pull request.`);
  process.exit(1);
}
if (!measureOnly) console.log('\nEvery page is within its budget.');
