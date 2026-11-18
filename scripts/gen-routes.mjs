/**
 * Finds the site's public pages by walking src/app/(main) for page.tsx files, and writes them to
 * src/data/routes.generated.json with each page's title and description read from its metadata.
 * The /sitemap page and sitemap.xml are built from this list, so a new page appears in both on
 * the next build with nothing to edit by hand. Runs before every build (package.json prebuild).
 *
 * Left out: the admin, pages with a dynamic segment ([slug]: posts, topics and case studies are
 * listed from the content instead), pages that only redirect, and pages marked noindex.
 * Also listed: the feeds and files for machines at the root (rss.xml, llms.txt, sitemap.xml), not
 * the site's internal JSON.
 * Run: node scripts/gen-routes.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const appDir = join(root, 'src', 'app', '(main)');
const out = join(root, 'src', 'data', 'routes.generated.json');

const SUFFIX = / — Boda Madhukar Reddy$/;
const STRING = String.raw`(['"\`])((?:\\.|(?!\1).)*)\1`;

/** Every page.tsx under a directory. */
function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === 'page.tsx' ? [path] : [];
  });
}

/** The first string after `key:` in the metadata block (also inside `{ absolute: ... }`). */
function field(source, key) {
  const metadata = source.slice(source.indexOf('export const metadata'));
  if (!source.includes('export const metadata')) return '';
  const match = metadata.match(new RegExp(String.raw`\b${key}:\s*(?:\{\s*absolute:\s*)?${STRING}`));
  return match ? match[2].replace(/\\(.)/g, '$1') : '';
}

const routes = pages(appDir)
  .map((file) => {
    const segments = relative(appDir, file).split(sep).slice(0, -1);
    return { file, segments, path: '/' + segments.join('/') };
  })
  .filter(({ segments }) => !segments.some((s) => s.startsWith('[') || s === 'admin'))
  .map(({ file, path }) => {
    const source = readFileSync(file, 'utf8');
    return { path: path === '/' ? '/' : path, source };
  })
  .filter(({ source }) => !/permanentRedirect\(|\bredirect\(/.test(source.replace(/import[^;]+;/g, '')) || source.includes('export const metadata'))
  .filter(({ source }) => !/index:\s*false|noindex/.test(source))
  .map(({ path, source }) => ({
    path,
    title: (field(source, 'title') || path.slice(1)).replace(SUFFIX, ''),
    description: field(source, 'description'),
  }))
  .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));

// Route folders named like files (rss.xml, llms.txt) and Next's metadata files, at the app root.
const appRoot = join(root, 'src', 'app');
const files = [
  ...readdirSync(appRoot).filter((name) => /\.(xml|txt)$/.test(name) && statSync(join(appRoot, name)).isDirectory()),
  ...(readdirSync(appRoot).includes('sitemap.ts') ? ['sitemap.xml'] : []),
]
  .sort()
  .map((name) => ({ path: `/${name}` }));

writeFileSync(out, JSON.stringify({ pages: routes, files }, null, 2) + '\n');
console.log(`Found ${routes.length} pages: ${routes.map((r) => r.path).join(' ')}`);
console.log(`Found ${files.length} files: ${files.map((f) => f.path).join(' ')}`);
