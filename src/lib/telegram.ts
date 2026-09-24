/**
 * Minimal Telegram Bot API client. Needs TELEGRAM_BOT_TOKEN (from @BotFather)
 * and TELEGRAM_CHAT_ID (your chat with the bot) in the server environment.
 */

// Values pasted into a dashboard often carry quotes or stray whitespace.
const env = (name: string) => process.env[name]?.trim().replace(/^(['"])(.*)\1$/, '$2').trim() || undefined;

const REQUIRED = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'] as const;

/** Names of required variables that are missing (never their values). */
export function missingTelegramVars() {
  return REQUIRED.filter((name) => !env(name));
}

export function telegramConfigured() {
  return missingTelegramVars().length === 0;
}

/** Escapes text for Telegram's HTML parse mode. */
export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(html: string) {
  const token = env('TELEGRAM_BOT_TOKEN');
  const chatId = env('TELEGRAM_CHAT_ID');
  if (!token || !chatId) throw new Error('Telegram is not configured');

  // TELEGRAM_API_BASE is only for pointing tests at a mock server.
  const base = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
  const res = await fetch(`${base}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Telegram API ${res.status}: ${detail.slice(0, 200)}`);
  }
}
