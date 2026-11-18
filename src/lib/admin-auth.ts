/**
 * Server-side check that a request comes from a signed-in admin: its Authorization header must be a
 * bearer token the API accepts as a current admin session (GetCurrentAdmin). Used by the site's own
 * admin-only routes (app/api/revalidate, app/api/resolve-stack). Server-side only.
 */

const BEARER = /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/;

/** True only if the API accepts the header's token as a current admin session. */
export async function isAdminRequest(authorization: string): Promise<boolean> {
  const api = (process.env.API_URL || '').replace(/\/$/, '');
  if (!api || !BEARER.test(authorization)) return false;
  try {
    const response = await fetch(`${api}/api/GetCurrentAdmin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok && ((await response.json()) as { returnCode?: number }).returnCode === 1;
  } catch {
    return false;
  }
}
