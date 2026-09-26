'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Fingerprint, KeyRound, Loader2 } from 'lucide-react';
import { apiCall, errorMessage } from '@/lib/admin/api';
import { getPasskey, isPasskeyCancelled, isPasskeySupported } from '@/lib/admin/webauthn';
import type { AuthToken, MfaChallenge, PasskeyOptions } from '@/lib/admin/types';
import { useAdmin } from '@/components/admin/session';
import { Field, Notice, Spinner, fieldClass, secondaryButton } from '@/components/admin/ui';

// Only ever return to an admin page on this site.
const safeNext = (next: string | null) => (next && /^\/admin(\/|$)/.test(next) && !next.startsWith('//') ? next : '/admin');

function SignIn() {
  const { status, error: sessionError, signIn } = useAdmin();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [step, setStep] = useState<'password' | 'code'>('password');
  const [busy, setBusy] = useState<'passkey' | 'password' | 'code' | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [passkeys, setPasskeys] = useState(false);

  useEffect(() => setPasskeys(isPasskeySupported()), []);
  useEffect(() => {
    if (status === 'signed-in') router.replace(next);
  }, [status, next, router]);

  const finish = (token: AuthToken) => signIn(token);

  const withPasskey = async () => {
    setError('');
    setBusy('passkey');
    try {
      const { challengeId, options } = await apiCall<PasskeyOptions>('PasskeyLoginOptions');
      const credential = await getPasskey(options);
      finish(await apiCall<AuthToken>('PasskeyLogin', { challengeId, credential }));
    } catch (e) {
      if (!isPasskeyCancelled(e)) setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const withPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy('password');
    try {
      const challenge = await apiCall<MfaChallenge>('Login', { email, password });
      setMfaToken(challenge.mfaToken);
      setPassword('');
      setStep('code');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const withCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy('code');
    try {
      const value = code.trim();
      finish(await apiCall<AuthToken>('VerifyMfa', useRecovery ? { mfaToken, recoveryCode: value } : { mfaToken, code: value.replace(/\s/g, '') }));
    } catch (e) {
      setError(errorMessage(e));
      setCode('');
    } finally {
      setBusy(null);
    }
  };

  if (status === 'loading' || status === 'signed-in') return <Spinner label={status === 'loading' ? 'Checking your session' : 'Signing you in'} />;

  return (
    <div className="mx-auto max-w-md">
      <p className="eyebrow">Admin</p>
      <h1 className="mb-6 text-4xl font-bold tracking-tight">Sign in</h1>

      <div className="glass space-y-5 p-6">
        {(error || sessionError) && <Notice>{error || sessionError}</Notice>}

        {step === 'password' ? (
          <>
            {passkeys && (
              <>
                <button type="button" onClick={withPasskey} disabled={busy !== null} className="tinted-button w-full justify-center !py-3">
                  {busy === 'passkey' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  Sign in with a passkey
                </button>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-foreground/10" />
                  or with your password
                  <span className="h-px flex-1 bg-foreground/10" />
                </div>
              </>
            )}
            <form onSubmit={withPassword} className="space-y-4">
              <Field label="Email">
                <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
              </Field>
              <Field label="Password">
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
              </Field>
              <button type="submit" disabled={busy !== null} className={`${passkeys ? secondaryButton : 'tinted-button'} w-full justify-center !py-2.5`}>
                {busy === 'password' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Continue
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={withCode} className="space-y-4">
            <button type="button" onClick={() => { setStep('password'); setCode(''); setError(''); }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {useRecovery ? (
              <Field label="Recovery code" hint="Each recovery code works once.">
                <input required autoFocus autoComplete="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} className={`${fieldClass} font-mono`} placeholder="xxxxx-xxxxx-xxxxx-xxxxx" />
              </Field>
            ) : (
              <Field label="Authenticator code" hint="The 6-digit code from your authenticator app.">
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,7}"
                  maxLength={7}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`${fieldClass} font-mono text-lg tracking-[0.3em]`}
                  placeholder="123456"
                />
              </Field>
            )}
            <button type="submit" disabled={busy !== null} className="tinted-button w-full justify-center !py-2.5">
              {busy === 'code' && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify and sign in
            </button>
            <button type="button" onClick={() => { setUseRecovery(!useRecovery); setCode(''); setError(''); }} className="block w-full text-center text-sm text-primary hover:underline">
              {useRecovery ? 'Use your authenticator app instead' : 'Lost your authenticator? Use a recovery code'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        First time here? <Link href="/admin/setup" className="font-medium text-primary hover:underline">Set up the admin account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SignIn />
    </Suspense>
  );
}
