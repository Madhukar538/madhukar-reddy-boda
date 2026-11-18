import { existsSync, readFileSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { SourceMapConsumer, type RawSourceMap } from 'source-map-js';
import { isAdminRequest } from '@/lib/admin-auth';
import type { ResolvedFrame } from '@/lib/admin/types';

/**
 * Turns a browser error's minified stack (from Admin → Errors) into source files and lines, using the
 * source maps the build keeps private (scripts/hide-source-maps.mjs). Admin only: the request must
 * carry a live admin session. Only files under the private maps folder are ever read.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAPS = join(process.cwd(), '.next', 'private-source-maps');
const MAX_BODY_BYTES = 16 * 1024;
const FRAME = /\/_next\/static\/([\w\-./]+\.js):(\d+):(\d+)/g;
const consumers = new Map<string, SourceMapConsumer | null>();

/** The consumer for one bundle's map, or null when there is none (cached either way). */
function consumerFor(file: string): SourceMapConsumer | null {
  if (consumers.has(file)) return consumers.get(file)!;
  const path = normalize(join(MAPS, `${file}.map`));
  let consumer: SourceMapConsumer | null = null;
  if (path.startsWith(MAPS + sep) && existsSync(path)) {
    try {
      consumer = new SourceMapConsumer(JSON.parse(readFileSync(path, 'utf8')) as RawSourceMap);
    } catch {
      consumer = null;
    }
  }
  consumers.set(file, consumer);
  return consumer;
}

/** "turbopack:///[project]/src/x.tsx" → "src/x.tsx". */
const tidy = (source: string) => source.replace(/^.*?\[project\]\//, '').replace(/^webpack:\/\/[^/]*\/\.?\/?/, '');

export async function POST(request: Request) {
  if (!(await isAdminRequest(request.headers.get('authorization') ?? ''))) {
    return Response.json({ message: 'Not signed in.' }, { status: 401 });
  }
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) return Response.json({ message: 'Body too large.' }, { status: 413 });
  let text = '';
  try {
    const parsed = JSON.parse(body) as { stack?: unknown; source?: unknown; line?: unknown; column?: unknown };
    const where = typeof parsed.source === 'string' && parsed.source ? `${parsed.source}:${Number(parsed.line) || 0}:${Number(parsed.column) || 0}` : '';
    text = `${where}\n${typeof parsed.stack === 'string' ? parsed.stack : ''}`;
  } catch {
    return Response.json({ message: 'Body must be JSON.' }, { status: 400 });
  }

  const frames: ResolvedFrame[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(FRAME)) {
    const [generated, file, line, column] = match;
    if (seen.has(generated) || frames.length >= 20) continue;
    seen.add(generated);
    const original = consumerFor(file)?.originalPositionFor({ line: Number(line), column: Math.max(0, Number(column) - 1) });
    if (original?.source) {
      frames.push({ generated, source: tidy(original.source), line: original.line ?? 0, column: (original.column ?? 0) + 1, name: original.name ?? null });
    } else {
      frames.push({ generated, source: '', line: 0, column: 0, name: null });
    }
  }
  return Response.json({ frames, hasMaps: existsSync(MAPS) });
}
