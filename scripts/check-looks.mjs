// Opens the site's main pages in every look, at desktop and phone widths, and fails if a page
// doesn't keep the look, a look's own blocks are missing, a phone page scrolls sideways, the
// browser logs an error, or (at desktop) axe finds a WCAG 2 A/AA problem such as text contrast.
// Saves a desktop screenshot of each page and look to look-shots/.
//
//   BASE_URL=http://localhost:3000 node scripts/check-looks.mjs
//
// The looks are read from KNOWN_THEMES in src/lib/content.ts, so a new look is checked as soon as
// it is registered.
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const OUT = 'look-shots';
mkdirSync(OUT, { recursive: true });

const content = readFileSync('src/lib/content.ts', 'utf8');
const looks = [...(content.match(/KNOWN_THEMES[^=]*=\s*\[([^\]]+)\]/)?.[1] ?? '').matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
if (looks.length === 0) throw new Error('No looks found in KNOWN_THEMES');

/** The block that must be on screen in a look, per page (null: nothing look-specific to check). */
function expected(look, page) {
  if (page === 'home') return look === 'midnight' ? '.home-classic' : look === 'editorial' ? '.home-editorial' : `.home-${look}`;
  if (!['experience', 'about', 'projects'].includes(page)) return null;
  if (look === 'midnight') return '.classic-only';
  if (look === 'editorial') return page === 'about' ? '.ed-about' : '.ed-only';
  return `.only-${look}`;
}

const browser = await chromium.launch();
const failures = [];

// A blog post to check: the first one linked from the homepage.
const probe = await browser.newPage();
await probe.goto(`${BASE}/`, { waitUntil: 'networkidle' });
const post = await probe.evaluate(() => document.querySelector('a[href^="/blog/"]')?.getAttribute('href'));
await probe.close();

const pages = [
  ['home', '/'],
  ['experience', '/experience'],
  ['about', '/about'],
  ['projects', '/projects'],
  ...(post ? [['post', post]] : []),
  ['404', '/this-page-does-not-exist'],
];

for (const look of looks) {
  for (const [name, path] of pages) {
    for (const [device, viewport] of [
      ['desktop', { width: 1280, height: 900 }],
      ['phone', { width: 390, height: 844 }],
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript((value) => localStorage.setItem('portfolio-style', value), look);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      const where = `${look} ${path} (${device})`;
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45_000 });
        await page.waitForTimeout(400);
        const selector = expected(look, name);
        const state = await page.evaluate((sel) => {
          const el = sel ? document.querySelector(sel) : null;
          return {
            look: document.documentElement.dataset.style ?? 'midnight',
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            shown: sel ? !!el && el.getBoundingClientRect().height > 40 && getComputedStyle(el).display !== 'none' : true,
          };
        }, selector);
        if (state.look !== look) failures.push(`${where}: page is in ${state.look}`);
        if (!state.shown) failures.push(`${where}: ${selector} is not on screen`);
        if (device === 'phone' && state.overflow > 1) failures.push(`${where}: scrolls sideways by ${state.overflow}px`);
        // A missing page logs its own 404 to the console; that one is expected.
        for (const e of errors.filter((msg) => !(name === '404' && /404/.test(msg)))) failures.push(`${where}: ${e.slice(0, 200)}`);
        if (device === 'desktop') {
          await page.screenshot({ path: `${OUT}/${look}-${name}.png` });
          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          for (const v of axe.violations) {
            const node = v.nodes[0];
            const detail = (node?.any[0]?.message ?? v.help).split('. Expected')[0];
            failures.push(`${where}: ${v.id} on ${v.nodes.length} element(s), e.g. ${node?.target.join(' ')}: ${detail}`);
          }
        }
      } catch (e) {
        failures.push(`${where}: ${String(e.message).split('\n')[0]}`);
      }
      await context.close();
    }
  }
  console.log(`checked ${look}`);
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nAll ${looks.length} looks pass on ${pages.length} pages at desktop and phone widths.`);
