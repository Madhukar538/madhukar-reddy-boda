'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

/** Sends uncaught script errors and unhandled promise rejections to Admin → Errors (lib/report-error.ts). */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error ?? e.message, { source: e.filename, line: e.lineno, column: e.colno });
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
