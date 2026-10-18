import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getContent } from '@/lib/content';
import { createPortfolioServer } from '@/lib/mcp-server';

// MCP endpoint (Streamable HTTP, stateless). Each POST gets a fresh server
// and transport, with plain JSON responses, so there's no session state to
// keep and it works behind any proxy.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function siteUrl(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0] ?? url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  return `${proto}://${host}`;
}

// MCP requests are small JSON-RPC messages; refuse anything bigger before parsing.
const MAX_BODY_BYTES = 64 * 1024;

async function boundedRequest(request: Request): Promise<Request | null> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return null;
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) return null;
  return new Request(request.url, { method: request.method, headers: request.headers, body });
}

export async function POST(incoming: Request) {
  const request = await boundedRequest(incoming);
  if (!request) return withCors(Response.json({ error: 'Request too large' }, { status: 413 }));
  const server = createPortfolioServer(siteUrl(request), await getContent());
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    return withCors(await transport.handleRequest(request));
  } finally {
    // Stateless: nothing survives the request.
    void transport.close();
    void server.close();
  }
}

export async function GET(request: Request) {
  // People opening /mcp in a browser get the human-readable page.
  if (request.headers.get('accept')?.includes('text/html')) {
    return Response.redirect(new URL('/ai', siteUrl(request)), 302);
  }
  // This stateless server has no standalone SSE stream (allowed by the spec).
  return withCors(
    new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed. Use POST.' }, id: null }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
    })
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
