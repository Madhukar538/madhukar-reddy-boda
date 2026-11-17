/**
 * The "book a debug call" link (Cal.com, Calendly or similar), from BOOKING_URL on the server.
 * Unset, or not an https address, the button is simply not shown.
 */
export function bookingUrl(): string | null {
  const value = (process.env.BOOKING_URL || '').trim();
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}
