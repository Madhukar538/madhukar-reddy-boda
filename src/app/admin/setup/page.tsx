'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import { apiCall, errorMessage } from '@/lib/admin/api';
import type { RecoveryCodes, SetupResult } from '@/lib/admin/types';
import { Field, Notice, fieldClass } from '@/components/admin/ui';
import { RecoveryCodeList } from '@/components/admin/recovery-codes';

/**
 * One-time enrolment of the single admin: the setup token from the server's
 * environment, then an authenticator app, then recovery codes. Once it's
 * done, remove SETUP_TOKEN from the API so this can't run again.
 */

const STEPS = ['Account', 'Authenticator', 'Recovery codes'];

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [setupToken, setSetupToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [enrolment, setEnrolment] = useState<SetupResult | null>(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // The QR code is drawn in the browser; the secret never goes anywhere else.
  useEffect(() => {
    if (!enrolment) return;
    let cancelled = false;
    import('qrcode')
      .then((QR) => QR.toDataURL(enrolment.otpAuthUri, { margin: 1, width: 232, errorCorrectionLevel: 'M' }))
      .then((url) => !cancelled && setQr(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enrolment]);

  const run = async (task: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await task();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const createAccount = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("The passwords don't match.");
    void run(async () => {
      setEnrolment(await apiCall<SetupResult>('SetupAdmin', { setupToken: setupToken.trim(), email, password }));
      setPassword('');
      setConfirm('');
      setStep(1);
    });
  };

  const confirmCode = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const result = await apiCall<RecoveryCodes>('ConfirmTotpSetup', { enrollmentToken: enrolment!.enrollmentToken, code: code.replace(/\s/g, '') });
      setCodes(result.recoveryCodes);
      setStep(2);
    }).finally(() => setCode(''));
  };

  return (
    <div className="mx-auto max-w-lg">
      <p className="eyebrow">Admin</p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight">Set up the admin account</h1>
      <ol className="mb-6 flex gap-2 text-xs font-medium">
        {STEPS.map((label, i) => (
          <li key={label} className={`chip ${i === step ? 'chip-accent' : ''}`} aria-current={i === step ? 'step' : undefined}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="glass space-y-5 p-6">
        {error && <Notice>{error}</Notice>}

        {step === 0 && (
          <form onSubmit={createAccount} className="space-y-4">
            <Field label="Setup token" hint="The SETUP_TOKEN value from the API's environment. It works until the admin account exists.">
              <input required autoComplete="off" spellCheck={false} value={setupToken} onChange={(e) => setSetupToken(e.target.value)} className={`${fieldClass} font-mono`} />
            </Field>
            <Field label="Email">
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="Password" hint="12 to 128 characters. A long passphrase from a password manager is ideal.">
              <input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="Confirm password">
              <input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldClass} />
            </Field>
            <button type="submit" disabled={busy} className="tinted-button w-full justify-center !py-2.5">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>
        )}

        {step === 1 && enrolment && (
          <form onSubmit={confirmCode} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this with an authenticator app (1Password, Google Authenticator, Authy, Microsoft Authenticator), then enter the code it shows.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <div className="flex h-[232px] w-[232px] shrink-0 items-center justify-center rounded-xl bg-white p-2">
                {qr ? <img src={qr} alt="QR code for your authenticator app" width={216} height={216} /> : <Loader2 className="h-5 w-5 animate-spin text-black/50" />}
              </div>
              <div className="min-w-0 space-y-2 text-sm">
                <p className="font-semibold">Can&apos;t scan it?</p>
                <p className="text-muted-foreground">Enter this key manually (time-based, 6 digits, 30 seconds):</p>
                <code className="block break-all rounded-lg bg-foreground/[0.06] px-2.5 py-2 font-mono text-[13px]">
                  {enrolment.totpSecret.replace(/(.{4})/g, '$1 ').trim()}
                </code>
                <a href={enrolment.otpAuthUri} className="inline-block text-primary hover:underline sm:hidden">
                  Open in authenticator app
                </a>
              </div>
            </div>
            <Field label="Code from the app">
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
            <button type="submit" disabled={busy} className="tinted-button w-full justify-center !py-2.5">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Turn on two-factor sign-in
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Notice kind="success">Your admin account is ready.</Notice>
            <p className="text-sm text-muted-foreground">
              Save these recovery codes somewhere safe and offline, such as a password manager. Each one signs you in once if you lose your authenticator.
              They won&apos;t be shown again.
            </p>
            <RecoveryCodeList codes={codes} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
              I&apos;ve saved my recovery codes
            </label>
            <Notice kind="success">
              Next: remove <code>SETUP_TOKEN</code> from the API&apos;s environment and redeploy it, then sign in and add a passkey under Security.
            </Notice>
            <Link href="/admin/login" aria-disabled={!saved} className={`tinted-button w-full justify-center !py-2.5 ${saved ? '' : 'pointer-events-none opacity-50'}`}>
              <ShieldCheck className="h-4 w-4" />
              Continue to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
