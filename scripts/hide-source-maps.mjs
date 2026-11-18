/**
 * After `next build`: moves the browser bundles' source maps out of .next/static (which Next serves to
 * anyone) into .next/private-source-maps, which nothing serves, and drops the sourceMappingURL comment
 * from each bundle so browsers don't ask for them. Admin → Errors reads them on the server
 * (app/api/resolve-stack) to turn a minified stack into source files and lines; visitors never get them.
 * Runs as package.json "postbuild".
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const staticDir = join(root, '.next', 'static');
const privateDir = join(root, '.next', 'private-source-maps');

if (!existsSync(staticDir)) {
  console.log('hide-source-maps: no .next/static, nothing to do');
  process.exit(0);
}

/** Every file under a directory. */
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

rmSync(privateDir, { recursive: true, force: true });
let moved = 0;
for (const file of files(staticDir)) {
  if (file.endsWith('.map')) {
    const target = join(privateDir, relative(staticDir, file));
    mkdirSync(dirname(target), { recursive: true });
    renameSync(file, target);
    moved++;
  } else if (file.endsWith('.js') || file.endsWith('.css')) {
    const text = readFileSync(file, 'utf8');
    const stripped = text.replace(/\n?\/[/*][#@] sourceMappingURL=[^\n]*\s*$/, '\n');
    if (stripped !== text) writeFileSync(file, stripped);
  }
}
console.log(`hide-source-maps: moved ${moved} source maps to .next/private-source-maps`);
