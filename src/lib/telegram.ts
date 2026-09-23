/**
 * Minimal Telegram Bot API client. Needs TELEGRAM_BOT_TOKEN (from @BotFather)
 * and TELEGRAM_CHAT_ID (your chat with the bot) in the server environment.
 */

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Escapes text for Telegram's HTML parse mode. */
export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(html: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
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
