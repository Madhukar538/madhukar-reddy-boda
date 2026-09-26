'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Fingerprint, Loader2, LogOut, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/admin/api';
import { createPasskey, isPasskeyCancelled, isPasskeySupported } from '@/lib/admin/webauthn';
import type { AdminInfo, AuditEntry, Passkey, PasskeyOptions, RecoveryCodes } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { RecoveryCodeList } from '@/components/admin/recovery-codes';
import { Field, Notice, Panel, Spinner, dangerButton, fieldClass, formatDateTime, secondaryButton } from '@/components/admin/ui';

type Message = { kind: 'error' | 'success'; text: string } | null;

/** Asks for a current authenticator code before a sensitive action (step-up). */
function StepUp({ label, busy, onConfirm, onCancel }: { label: string; busy: boolean; onConfirm: (code: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(code.replace(/\s/g, ''));
    setCode('');
  };
  return (
    <form onSubmit={submit} className="glass-inset mt-3 flex flex-wrap items-end gap-3 rounded-xl p-3">
      <Field label="Authenticator code" hint="Needed to confirm this change." className="min-w-[12rem] flex-1">
        <input
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`${fieldClass} font-mono tracking-[0.3em]`}
          placeholder="123456"
        />
      </Field>
      <div className="flex gap-2 pb-5">
        <button type="button" onClick={onCancel} className={secondaryButton}>Cancel</button>
        <button type="submit" disabled={busy} className="tinted-button">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {label}
        </button>
      </div>
    </form>
  );
}

function Security() {
  const { call, signOut } = useAdmin();
  const [info, setInfo] = useState<AdminInfo | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const [supported, setSupported] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [passkeyMsg, setPasskeyMsg] = useState<Message>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [codesMsg, setCodesMsg] = useState<Message>(null);

  const load = useCallback(async () => {
    try {
      const [i, p, a] = await Promise.all([
        call<AdminInfo>('GetCurrentAdmin'),
        call<Passkey[]>('GetPasskeys'),
        call<AuditEntry[]>('GetAuditLog', { limit: 100 }),
      ]);
      setInfo(i);
      setPasskeys(p);
      setAudit(a);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [call]);

  useEffect(() => {
    setSupported(isPasskeySupported());
    void load();
  }, [load]);

  const addPasskey = async (e: FormEvent) => {
    e.preventDefault();
    setPasskeyMsg(null);
    setBusy('add');
    try {
      const { challengeId, options } = await call<PasskeyOptions>('PasskeyRegisterOptions');
      const credential = await createPasskey(options);
      await call('PasskeyRegister', { challengeId, name: newName.trim() || 'Passkey', credential });
      setNewName('');
      setPasskeyMsg({ kind: 'success', text: 'Passkey added. You can now sign in with it.' });
      await load();
    } catch (e) {
      if (!isPasskeyCancelled(e)) setPasskeyMsg({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const deletePasskey = async (id: string, code: string) => {
    setPasskeyMsg(null);
    setBusy(`delete:${id}`);
    try {
      await call('DeletePasskey', { id, code });
      setDeleting(null);
      setPasskeyMsg({ kind: 'success', text: 'Passkey removed.' });
      await load();
    } catch (e) {
      setPasskeyMsg({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async (code: string) => {
    setCodesMsg(null);
    setBusy('codes');
    try {
      const result = await call<RecoveryCodes>('RegenerateRecoveryCodes', { code });
      setCodes(result.recoveryCodes);
      setRegenerating(false);
      await load();
    } catch (e) {
      setCodesMsg({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  if (loadError) return <Notice>{loadError}</Notice>;
  if (!info || !passkeys || !audit) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass p-5"><p className="text-sm text-muted-foreground">Signed in as</p><p className="mt-1 truncate font-semibold">{info.email}</p><p className="mt-1 text-xs text-muted-foreground">Last sign-in {formatDateTime(info.lastLoginAt)}</p></div>
        <div className="glass p-5"><p className="text-sm text-muted-foreground">Passkeys</p><p className="mt-1 text-3xl font-bold tabular-nums">{info.passkeyCount}</p></div>
        <div className="glass p-5"><p className="text-sm text-muted-foreground">Recovery codes left</p><p className={cn('mt-1 text-3xl font-bold tabular-nums', info.recoveryCodesLeft < 4 && 'text-[hsl(var(--destructive))]')}>{info.recoveryCodesLeft}</p></div>
      </div>

      <Panel title="Passkeys" description="Sign in with Face ID, Touch ID, Windows Hello or a security key. Passkeys can't be phished, so they're the safest way in.">
        <div className="space-y-3">
          {passkeyMsg && <Notice kind={passkeyMsg.kind}>{passkeyMsg.text}</Notice>}
          {passkeys.length === 0 && <p className="text-sm text-muted-foreground">No passkeys yet. Add one to sign in without a password.</p>}
          <ul className="space-y-2">
            {passkeys.map((p) => (
              <li key={p.id} className="glass-inset rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Fingerprint className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDateTime(p.createdAt)} · last used {formatDateTime(p.lastUsedAt)}
                      {p.isBackedUp ? ' · synced' : ' · this device only'}
                    </p>
                  </div>
                  {deleting !== p.id && (
                    <button type="button" onClick={() => setDeleting(p.id)} className={dangerButton}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  )}
                </div>
                {deleting === p.id && <StepUp label="Remove passkey" busy={busy === `delete:${p.id}`} onConfirm={(code) => deletePasskey(p.id, code)} onCancel={() => setDeleting(null)} />}
              </li>
            ))}
          </ul>
          {supported ? (
            <form onSubmit={addPasskey} className="flex flex-wrap items-end gap-3 pt-2">
              <Field label="Name" className="min-w-[12rem] flex-1">
                <input maxLength={60} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="MacBook Touch ID" className={fieldClass} />
              </Field>
              <button type="submit" disabled={busy !== null} className="tinted-button mb-0.5">
                {busy === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add a passkey
              </button>
            </form>
          ) : (
            <Notice>This browser doesn&apos;t support passkeys.</Notice>
          )}
        </div>
      </Panel>

      <Panel title="Password sign-in" description="Turned on or off by hand in the database, so nobody can change it from a browser.">
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', info.isPasswordLoginAllowed ? 'bg-[hsl(var(--sys-orange))]' : 'bg-primary')} aria-hidden />
            {info.isPasswordLoginAllowed ? (
              <span><strong>On.</strong> You can sign in with a passkey, or with your email, password and authenticator code.</span>
            ) : (
              <span><strong>Off.</strong> Only passkeys can sign in.</span>
            )}
          </p>
          {!info.isPasswordLoginEnabled && info.passkeyCount === 0 && (
            <Notice>It&apos;s switched off in the database, but stays on until you add a passkey, so you can&apos;t be locked out.</Notice>
          )}
          <p className="text-muted-foreground">
            To change it: MongoDB Atlas → Browse Collections → <code>portfolio</code> → <code>settings</code> → the document with <code>_id: &quot;security&quot;</code> → set <code>IsPasswordLoginEnabled</code> to <code>false</code> (passkey only) or <code>true</code>. It applies straight away.
          </p>
        </div>
      </Panel>

      <Panel title="Recovery codes" description="Single-use codes for signing in if you lose your authenticator. Creating new ones cancels the old ones.">
        {codesMsg && <div className="mb-3"><Notice kind={codesMsg.kind}>{codesMsg.text}</Notice></div>}
        {codes.length > 0 ? (
          <div className="space-y-3">
            <Notice kind="success">New codes created. Save them now: they won&apos;t be shown again, and the old ones no longer work.</Notice>
            <RecoveryCodeList codes={codes} />
            <button type="button" onClick={() => setCodes([])} className={secondaryButton}>I&apos;ve saved them</button>
          </div>
        ) : regenerating ? (
          <StepUp label="Create new codes" busy={busy === 'codes'} onConfirm={regenerate} onCancel={() => setRegenerating(false)} />
        ) : (
          <button type="button" onClick={() => setRegenerating(true)} className={secondaryButton}>
            <RefreshCw className="h-4 w-4" /> Create new recovery codes
          </button>
        )}
      </Panel>

      <Panel title="Sessions" description="Ends every session on every device, including this one, straight away.">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Sign out on every device?')) void signOut(true);
          }}
          className={dangerButton}
        >
          <LogOut className="h-4 w-4" /> Sign out everywhere
        </button>
      </Panel>

      <Panel title="Activity" description="Sign-ins, failures, security changes and content edits, newest first.">
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 font-medium">When</th>
                <th className="px-2 py-1.5 font-medium">Event</th>
                <th className="px-2 py-1.5 font-medium">Detail</th>
                <th className="px-2 py-1.5 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-foreground/5 align-top" title={a.userAgent}>
                  <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-muted-foreground">{formatDateTime(a.at)}</td>
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', a.isSuccess ? 'bg-primary' : 'bg-[hsl(var(--destructive))]')} aria-hidden />
                      {a.action}
                      <span className="sr-only">{a.isSuccess ? '(succeeded)' : '(failed)'}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">{a.detail}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs text-muted-foreground">{a.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {audit.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No activity yet.</p>}
        </div>
      </Panel>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <AdminShell title="Security">
      <Security />
    </AdminShell>
  );
}
