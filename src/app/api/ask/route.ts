import { GENERIC, retrieve } from '@/lib/madhu-bot/retrieval';
import { buildPrompt, extractiveAnswer, llmConfig, streamLlm } from '@/lib/madhu-bot/generate';

// Madhu-bot: streams newline-delimited JSON events —
//   trace (retrieval + prompt) → token… → done (timings)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUESTION = 400;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hitsByClient = new Map<string, number[]>();

function rateLimited(request: Request) {
  const client =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous';
  const now = Date.now();
  const recent = (hitsByClient.get(client) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hitsByClient.set(client, recent);
  if (hitsByClient.size > 5000) hitsByClient.clear(); // keep memory bounded
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return Response.json({ error: 'Too many questions — try again in a minute.' }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  if (!question) return Response.json({ error: 'Ask a question.' }, { status: 400 });

  const started = performance.now();
  const { terms, unknown, hits, corpusSize } = retrieve(question, 5);
  const retrievalMs = performance.now() - started;
  const config = llmConfig();
  const prompt = buildPrompt(question, hits);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let mode: 'llm' | 'extractive' = config && hits.length ? 'llm' : 'extractive';

      send({
        type: 'trace',
        terms,
        unknown,
        generic: terms.filter((t) => GENERIC.has(t)),
        corpusSize,
        mode,
        model: mode === 'llm' ? config!.model : null,
        hits: hits.map((h) => ({
          rank: h.rank,
          title: h.chunk.title,
          href: h.chunk.href,
          kind: h.chunk.kind,
          score: h.score,
          matched: h.matched,
          snippet: h.chunk.text.replace(/```/g, '').replace(/\s+/g, ' ').trim().slice(0, 280),
        })),
        prompt: mode === 'llm' ? prompt : null,
        retrievalMs: Math.round(retrievalMs * 10) / 10,
      });

      const genStart = performance.now();
      let firstTokenMs: number | null = null;
      try {
        if (mode === 'llm') {
          const abort = AbortSignal.timeout(30_000);
          for await (const token of streamLlm(config!, prompt.system, prompt.user, abort)) {
            firstTokenMs ??= performance.now() - genStart;
            send({ type: 'token', text: token });
          }
        } else {
          send({ type: 'token', text: extractiveAnswer(question, hits, unknown) });
        }
      } catch (err) {
        // The model is optional: fall back to quoting sources.
        mode = 'extractive';
        send({ type: 'fallback', reason: err instanceof Error ? err.message : 'LLM unavailable' });
        send({ type: 'token', text: extractiveAnswer(question, hits, unknown) });
      }

      send({
        type: 'done',
        mode,
        retrievalMs: Math.round(retrievalMs * 10) / 10,
        firstTokenMs: firstTokenMs == null ? null : Math.round(firstTokenMs),
        generationMs: Math.round(performance.now() - genStart),
        totalMs: Math.round(performance.now() - started),
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
