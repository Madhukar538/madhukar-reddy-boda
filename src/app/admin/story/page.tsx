'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { SaveResult } from '@/lib/admin/types';
import { BUILT_IN_STORY, storySchema } from '@/lib/story';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { SaveBar, ensureRefreshed, savedMessage, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Notice, Panel, Spinner } from '@/components/admin/ui';

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

/** What's wrong with the text as a story, as short lines ("story.chapters.2.title: Required"); empty when it's valid. */
function problems(text: string): string[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return [`Not valid JSON: ${(e as Error).message}`];
  }
  const result = storySchema.safeParse(value);
  return result.success ? [] : result.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || 'story'}: ${i.message}`);
}

/**
 * The Editorial homepage's story as JSON: the hero, the running band and the chapters with their
 * exhibits (lib/story.ts describes every field). Checked as you type with the same rules the site
 * uses, so what saves is what shows; until one is saved, the site shows its built-in story.
 */
function StoryEditor() {
  const { call, refreshSite } = useAdmin();
  const [text, setText] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const load = useCallback(async () => {
    try {
      const data = await call<{ json: string }>('GetStory');
      const start = data.json ? pretty(JSON.parse(data.json)) : pretty(BUILT_IN_STORY);
      setIsCustom(Boolean(data.json));
      setText(start);
      setSaved(start);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const issues = useMemo(() => (text === null ? [] : problems(text)), [text]);
  const dirty = text !== null && text !== saved;
  useLeaveGuard(dirty);

  if (loadError) return <Notice>{loadError}</Notice>;
  if (text === null) return <Spinner />;

  const persist = async (json: string, mode: 'save' | 'delete') => {
    setBusy(mode);
    setStatus(null);
    try {
      const result = await call<SaveResult>('SaveStory', { json });
      setStatus({ kind: 'success', text: savedMessage(await ensureRefreshed(result, ['story'], refreshSite)) });
      await load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (issues.length > 0) return;
    // Stored compact; the editor shows it indented.
    persist(JSON.stringify(JSON.parse(text)), 'save');
  };

  const reset = () => {
    if (window.confirm('Go back to the built-in story? Your saved story is removed.')) persist('', 'delete');
  };

  return (
    <form onSubmit={save}>
      <Panel
        title="Homepage story"
        description="The Editorial homepage: hero, running band, and the chapters with the exhibit beside each. Text is plain; **bold** and *emphasis* are the only markup. Exhibit kinds: none, ticket, list, bars, tree, grid, team."
      >
        <p className="mb-3 text-sm text-muted-foreground">
          {isCustom ? 'The site shows this saved story.' : 'Nothing saved yet: the site shows the built-in story, loaded below to start from.'}
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setStatus(null);
            setText(e.target.value);
          }}
          spellCheck={false}
          rows={28}
          aria-label="Story JSON"
          aria-invalid={issues.length > 0}
          className="w-full resize-y rounded-xl bg-foreground/[0.04] p-4 font-mono text-[13px] leading-relaxed text-foreground ring-1 ring-foreground/10 outline-none focus:ring-2 focus:ring-primary"
        />
        {issues.length > 0 ? (
          <div className="mt-3">
            <Notice>
              <span className="block font-semibold">Fix these before saving:</span>
              {issues.map((i) => (
                <span key={i} className="block font-mono text-xs">{i}</span>
              ))}
            </Notice>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[hsl(var(--sys-green))]">Looks good: this is a valid story.</p>
        )}
      </Panel>
      <SaveBar
        busy={busy}
        dirty={dirty && issues.length === 0}
        status={status}
        extra={
          isCustom ? (
            <button type="button" onClick={reset} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-foreground/15 hover:bg-foreground/[0.06]">
              <RotateCcw className="h-4 w-4" /> Reset to built-in
            </button>
          ) : null
        }
      />
    </form>
  );
}

export default function StoryPage() {
  return (
    <AdminShell title="Story">
      <StoryEditor />
    </AdminShell>
  );
}
