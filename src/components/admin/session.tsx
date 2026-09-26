'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, apiCall, errorMessage } from '@/lib/admin/api';
import type { AuthToken } from '@/lib/admin/types';

/**
 * The admin session. The access token (15 minutes) is kept in memory only;
 * the refresh token is an HttpOnly cookie the API sets, so page scripts can
 * never read it. On load, and shortly before the access token expires, the
 * session is renewed through RefreshToken. Renewals are serialised across
 * tabs: refresh tokens rotate, and the API treats a reused one as theft and
 * ends the session.
 */

/** 'unavailable': the API couldn't confirm the session (offline, rate-limited), which is not the same as signed out. */
type Status = 'loading' | 'signed-out' | 'signed-in' | 'unavailable';

type AdminSession = {
  status: Status;
  /** Why the session couldn't be checked, when status is 'unavailable'. */
  error: string;
  /** Try the session check again. */
  retry: () => void;
  email: string;
  recoveryCodesLeft: number;
  /** Call an admin endpoint with the current token, renewing it once if it has expired. */
  call: <T>(action: string, body?: object) => Promise<T>;
  signIn: (token: AuthToken) => void;
  /** Refresh the live site's cached content now (fallback for when the API's own call didn't get through). */
  refreshSite: (tags: string[]) => Promise<boolean>;
  signOut: (everywhere?: boolean) => Promise<void>;
};

const Context = createContext<AdminSession | null>(null);

export function useAdmin() {
  const session = useContext(Context);
  if (!session) throw new Error('useAdmin must be used inside AdminSessionProvider');
  return session;
}

const RENEW_BEFORE_MS = 60_000;

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks ? (locks.request('dhucar-admin-refresh', task) as Promise<T>) : task();
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [token, setToken] = useState<AuthToken | null>(null);
  const tokenRef = useRef<AuthToken | null>(null);
  const renewing = useRef<Promise<AuthToken | null> | null>(null);

  const apply = useCallback((next: AuthToken | null) => {
    tokenRef.current = next;
    setToken(next);
    setError('');
    setStatus(next ? 'signed-in' : 'signed-out');
  }, []);

  const renew = useCallback(() => {
    renewing.current ??= withRefreshLock(() => apiCall<AuthToken>('RefreshToken', {}, { csrf: true }))
      .then((next) => {
        apply(next);
        return next;
      })
      .catch((e: unknown) => {
        // Only the API saying no ends the session. A rate limit or a network
        // blip keeps a still-valid token and tries again shortly.
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          apply(null);
          return null;
        }
        const current = tokenRef.current;
        if (current && Date.parse(current.expiresAt) > Date.now()) {
          window.setTimeout(() => void renew(), 30_000);
          return current;
        }
        setError(errorMessage(e));
        setStatus('unavailable');
        return null;
      })
      .finally(() => {
        renewing.current = null;
      });
    return renewing.current;
  }, [apply]);

  // Resume an existing session on load.
  useEffect(() => {
    void renew();
  }, [renew]);

  // Renew a minute before the access token expires.
  useEffect(() => {
    if (!token) return;
    const delay = Math.max(Date.parse(token.expiresAt) - Date.now() - RENEW_BEFORE_MS, 5_000);
    const timer = window.setTimeout(() => void renew(), delay);
    return () => window.clearTimeout(timer);
  }, [token, renew]);

  const call = useCallback(
    async <T,>(action: string, body: object = {}): Promise<T> => {
      const current = tokenRef.current ?? (await renew());
      if (!current) throw new ApiError('Your session has ended. Sign in again.', -2, 401);
      try {
        return await apiCall<T>(action, body, { token: current.accessToken });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const renewed = await renew();
        if (!renewed) throw new ApiError('Your session has ended. Sign in again.', -2, 401);
        return apiCall<T>(action, body, { token: renewed.accessToken });
      }
    },
    [renew]
  );

  const refreshSite = useCallback(async (tags: string[]) => {
    const current = tokenRef.current;
    if (!current) return false;
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${current.accessToken}` },
        body: JSON.stringify({ tags }),
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const signOut = useCallback(
    async (everywhere = false) => {
      const current = tokenRef.current;
      try {
        if (current) await apiCall('Logout', { isAllSessions: everywhere }, { token: current.accessToken, csrf: true });
      } catch {
        // Signed out locally either way.
      }
      apply(null);
    },
    [apply]
  );

  const value = useMemo<AdminSession>(
    () => ({
      status,
      error,
      retry: () => {
        setStatus('loading');
        void renew();
      },
      email: token?.email ?? '',
      recoveryCodesLeft: token?.recoveryCodesLeft ?? 0,
      call,
      signIn: apply,
      refreshSite,
      signOut,
    }),
    [status, error, token, call, apply, refreshSite, signOut, renew]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
