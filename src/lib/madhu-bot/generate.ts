import { profile } from '@/data/profile';
import { GENERIC, tokenize, type Hit } from './retrieval';

/**
 * Answer generation for Madhu-bot.
 *
 * If an OpenAI-compatible endpoint is configured (Ollama, LiteLLM, Groq,
 * Gemini's OpenAI endpoint, OpenRouter…) the answer is written by that model
 * from the retrieved passages. Otherwise the bot answers extractively by
 * quoting the most relevant sentences, so it works with zero cost or keys.
 *
 * Env (server-only):
 *   MADHU_BOT_LLM_BASE_URL   e.g. https://api.groq.com/openai/v1
 *   MADHU_BOT_LLM_API_KEY    optional for local endpoints
 *   MADHU_BOT_LLM_MODEL      e.g. llama-3.1-8b-instant
 */

export type LlmConfig = { baseUrl: string; apiKey?: string; model: string };

export function llmConfig(): LlmConfig | null {
  const baseUrl = process.env.MADHU_BOT_LLM_BASE_URL?.replace(/\/+$/, '');
  const model = process.env.MADHU_BOT_LLM_MODEL;
  if (!baseUrl || !model) return null;
  return { baseUrl, model, apiKey: process.env.MADHU_BOT_LLM_API_KEY };
}

export function buildPrompt(question: string, hits: Hit[]) {
  const context = hits
    .map((h) => `[${h.rank}] ${h.chunk.title}\n${h.chunk.text}`)
    .join('\n\n---\n\n');
  const system =
    `You are Madhu-bot, answering questions about ${profile.name}, a ${profile.title} at ${profile.company}, ` +
    'in his own voice (first person, plain and direct, like his blog). ' +
    'Use ONLY the numbered context passages. Cite passages inline like [1] or [2][3]. ' +
    'If the context does not contain the answer, say you have not written about that yet and suggest emailing ' +
    `${profile.email}. Keep answers under 150 words. Never invent employers, clients, numbers or dates.`;
  const user = `Context:\n\n${context}\n\nQuestion: ${question}`;
  return { system, user };
}

/** Streams tokens from an OpenAI-compatible /chat/completions endpoint. */
export async function* streamLlm(config: LlmConfig, system: string, user: string, signal: AbortSignal) {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const data = line.replace(/^data:\s*/, '').trim();
      if (!data || !line.startsWith('data:')) continue;
      if (data === '[DONE]') return;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // Ignore keep-alives and partial frames.
      }
    }
  }
}

/** Zero-cost answer: the most relevant sentences, each with its citation. */
export function extractiveAnswer(question: string, hits: Hit[], unknown: string[] = []): string {
  const missing = unknown.length ? `I haven't written about ${unknown.join(', ')} yet.` : '';
  if (!hits.length) {
    return `${missing || "I haven't written about that yet."} Try asking about my projects, R&D work or blog topics, or email me at ${profile.email}.`;
  }
  const terms = new Set(tokenize(question).filter((t) => !GENERIC.has(t)));
  const candidates = hits.slice(0, 3).flatMap((h) =>
    h.chunk.text
      .replace(/```[\s\S]*?```/g, ' ')
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim())
      .filter((s) => s.length > 30 && s.length < 320)
      .map((sentence, order) => ({
        sentence,
        rank: h.rank,
        order,
        score: tokenize(sentence).filter((t) => terms.has(t)).length + (h.rank === 1 ? 0.5 : 0),
      }))
  );
  const best = candidates
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.rank - b.rank || a.order - b.order)
    .slice(0, 4)
    .sort((a, b) => a.rank - b.rank || a.order - b.order);

  if (!best.length) {
    return `The closest thing I've written is “${hits[0].chunk.title}” [1]. Open it for the details.`;
  }
  const intro = missing ? `${missing} Here is the closest related work:` : 'Here is what I have written about that:';
  return [intro, '', ...best.map((b) => `- ${b.sentence} [${b.rank}]`)].join('\n');
}
