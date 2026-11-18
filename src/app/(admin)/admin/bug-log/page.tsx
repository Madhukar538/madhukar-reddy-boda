'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { SaveResult } from '@/lib/admin/types';
import { bugLog as builtInBugLog } from '@/data/bug-log';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { ListItem, SaveBar, ensureRefreshed, move, savedMessage, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Field, Notice, Panel, Spinner, fieldClass, formatDateTime } from '@/components/admin/ui';

type Entry = { title: string; when: string; stack: string; symptom: string; cause: string; fix: string; result: string };
type ApiBugLog = { entries: Partial<Entry>[]; updatedAt: string | null };

/** Each field's label, length limit and whether it is required: the same rules the API checks. */
const FIELDS: { key: keyof Entry; label: string; max: number; required: boolean; long?: boolean; placeholder: string }[] = [
  { key: 'title', label: 'Title', max: 120, required: true, placeholder: 'Checkout API timing out at 300 rps' },
  { key: 'when', label: 'When', max: 40, required: true, placeholder: 'Oct 2026' },
  { key: 'stack', label: 'Stack', max: 80, required: false, placeholder: '.NET 8 · SQL Server' },
  { key: 'symptom', label: 'Symptom', max: 800, required: true, long: true, placeholder: 'What people saw.' },
  { key: 'cause', label: 'Root cause', max: 800, required: true, long: true, placeholder: 'Why it happened.' },
  { key: 'fix', label: 'Fix', max: 800, required: true, long: true, placeholder: 'What changed.' },
  { key: 'result', label: 'Result', max: 200, required: false, placeholder: 'p95 from 4 s to 180 ms' },
];
const MAX_ENTRIES = 100;

const blank = (): Entry => ({ title: '', when: '', stack: '', symptom: '', cause: '', fix: '', result: '' });
const toEntry = (e: Partial<Entry>): Entry => ({ ...blank(), ...Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v ?? ''])) });

/** What stops the log from saving, one line per problem; empty when it can be saved. */
function problems(entries: Entry[]): string[] {
  const found: string[] = [];
  if (entries.length > MAX_ENTRIES) found.push(`The bug log is limited to ${MAX_ENTRIES} entries.`);
  entries.forEach((entry, i) => {
    for (const f of FIELDS) {
      const text = entry[f.key].trim();
      if (f.required && !text) found.push(`Entry ${i + 1} needs a ${f.label.toLowerCase()}.`);
      else if (text.length > f.max) found.push(`Entry ${i + 1}: the ${f.label.toLowerCase()} is limited to ${f.max} characters.`);
    }
  });
  return found;
}

/**
 * The public bug log (/bug-log), newest first: one entry per real fix, in words safe to publish
 * (no client names unless they agreed). Until it is saved here, the site shows src/data/bug-log.ts;
 * an empty saved log hides the page.
 */
function BugLogEditor() {
  const { call, refreshSite } = useAdmin();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [saved, setSaved] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const load = useCallback(async () => {
    try {
      const data = await call<ApiBugLog>('GetBugLog');
      const start = data.updatedAt ? data.entries.map(toEntry) : builtInBugLog.map((b) => toEntry({ ...b, result: b.result ?? '' }));
      setEntries(start);
      setSaved(JSON.stringify(start));
      setUpdatedAt(data.updatedAt);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const issues = useMemo(() => (entries ? problems(entries) : []), [entries]);
  const dirty = entries !== null && JSON.stringify(entries) !== saved;
  useLeaveGuard(dirty);

  if (loadError) return <Notice>{loadError}</Notice>;
  if (entries === null) return <Spinner />;

  const update = (change: (list: Entry[]) => Entry[]) => {
    setStatus(null);
    setEntries((list) => (list ? change(list) : list));
  };
  const setField = (i: number, key: keyof Entry, value: string) => update((list) => list.map((e, j) => (j === i ? { ...e, [key]: value } : e)));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (issues.length > 0) return;
    setBusy('save');
    setStatus(null);
    try {
      const trimmed = entries.map((x) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v.trim()])));
      const result = await call<SaveResult>('SaveBugLog', { entries: trimmed });
      setStatus({ kind: 'success', text: savedMessage(await ensureRefreshed(result, ['bugLog'], refreshSite)) });
      await load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <Panel
        title="Fixed bugs"
        description="Newest first. Real fixes only, in words safe to publish: no client names unless they agreed. Symptom, root cause and fix are required; stack and result are optional."
        actions={
          entries.length > 0 && !dirty ? (
            <Link href="/bug-log" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              View the page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {updatedAt
            ? `Last saved ${formatDateTime(updatedAt)}. ${entries.length === 0 ? 'The log is empty, so /bug-log answers 404 and nothing links to it.' : ''}`
            : 'Nothing saved yet: the site shows the built-in log (src/data/bug-log.ts), loaded below to start from.'}
        </p>
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <ListItem
              key={i}
              index={i}
              count={entries.length}
              onMove={(to) => update((list) => move(list, i, to))}
              onRemove={() => {
                if (!entry.title.trim() || window.confirm(`Remove "${entry.title.trim()}" from the log?`)) update((list) => list.filter((_, j) => j !== i));
              }}
            >
              <p className="font-mono text-xs text-muted-foreground">#{String(entries.length - i).padStart(3, '0')}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem_12rem]">
                {FIELDS.filter((f) => !f.long && f.key !== 'result').map((f) => (
                  <Field key={f.key} label={f.required ? f.label : `${f.label} (optional)`}>
                    <input value={entry[f.key]} maxLength={f.max} placeholder={f.placeholder} onChange={(e) => setField(i, f.key, e.target.value)} className={fieldClass} />
                  </Field>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {FIELDS.filter((f) => f.long).map((f) => (
                  <Field key={f.key} label={f.label} hint={`${entry[f.key].length}/${f.max}`}>
                    <textarea value={entry[f.key]} maxLength={f.max} rows={5} placeholder={f.placeholder} onChange={(e) => setField(i, f.key, e.target.value)} className={fieldClass} />
                  </Field>
                ))}
              </div>
              <Field label="Result (optional)" hint="The measurable outcome, if there is one.">
                <input value={entry.result} maxLength={200} placeholder="p95 from 4 s to 180 ms" onChange={(e) => setField(i, 'result', e.target.value)} className={fieldClass} />
              </Field>
            </ListItem>
          ))}
          {entries.length < MAX_ENTRIES && (
            <button type="button" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline" onClick={() => update((list) => [blank(), ...list])}>
              <Plus className="h-4 w-4" /> Add a fix at the top
            </button>
          )}
        </div>
        {issues.length > 0 && (
          <div className="mt-4">
            <Notice>
              <span className="block font-semibold">Fix these before saving:</span>
              {issues.slice(0, 8).map((i) => (
                <span key={i} className="block text-xs">{i}</span>
              ))}
            </Notice>
          </div>
        )}
      </Panel>
      <SaveBar busy={busy} dirty={dirty && issues.length === 0} status={status} />
    </form>
  );
}

export default function BugLogAdminPage() {
  return (
    <AdminShell title="Bug log">
      <BugLogEditor />
    </AdminShell>
  );
}
