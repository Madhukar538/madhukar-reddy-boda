/**
 * Browser client for the portfolio API. Every endpoint is POST /api/{Name}
 * and answers { returnCode, returnMessage, data }; returnCode 1 is success.
 * Requests carry credentials so the API can set and read its HttpOnly
 * refresh cookie; the access token itself only ever lives in memory.
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

/** This site's own host names; any other host is another site on the platform (src/proxy.ts). */
const PRIMARY_HOSTS = (process.env.NEXT_PUBLIC_PRIMARY_HOSTS || 'dhucar.in,www.dhucar.in,localhost,127.0.0.1')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** True on this site's own domain; false in another site's admin, on that site's domain. */
export const isPlatformHost = () => typeof window === 'undefined' || PRIMARY_HOSTS.includes(window.location.hostname.toLowerCase());

/**
 * Where the admin sends API calls: the API itself on this site, or, on another site's domain, that
 * domain's own /api pass-through (app/(sites)), so its session cookie is first-party there.
 */
const apiBase = () => (isPlatformHost() ? API_URL : '');

export class ApiError extends Error {
  constructor(
    message: string,
    /** The API's returnCode: -1 validation, -2 unauthorized, -3 forbidden, -4 locked out, -5 not found, -6 conflict. */
    readonly code: number,
    /** HTTP status, 0 when the API couldn't be reached. */
    readonly status: number
  ) {
    super(message);
  }
}

type CallOptions = { token?: string; csrf?: boolean; signal?: AbortSignal };

export async function apiCall<T>(action: string, body: object = {}, { token, csrf, signal }: CallOptions = {}): Promise<T> {
  if (isPlatformHost() && !API_URL) throw new ApiError('The admin needs NEXT_PUBLIC_API_URL to be set at build time.', -99, 0);

  // Uploads go as multipart (the browser sets its boundary); everything else is JSON.
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = isForm ? {} : { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  // The refresh and sign-out endpoints require this header; cross-site forms can't send it.
  if (csrf) headers['X-Requested-With'] = 'dhucar-admin';

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/${action}`, {
      method: 'POST',
      headers,
      body: isForm ? body : JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError("Can't reach the API. Check your connection and try again.", -99, 0);
  }

  let json: { returnCode?: number; returnMessage?: string; data?: T };
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      response.status === 429 ? 'Too many attempts. Wait a minute and try again.' : `The API answered ${response.status}.`,
      response.status === 429 ? -4 : -99,
      response.status
    );
  }
  if (json.returnCode !== 1) {
    throw new ApiError(json.returnMessage || `The API answered ${response.status}.`, json.returnCode ?? -99, response.status);
  }
  return json.data as T;
}

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.');
