'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/admin/api';
import type { AdminPage, SaveResult } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { SaveBar, ensureRefreshed, savedMessage, setFlash, takeFlash, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Field, Notice, Spinner, fieldClass } from '@/components/admin/ui';
import { ImagePicker } from '@/components/admin/image-picker';
import { previewDoc } from '@/components/admin/preview';

type Form = { slug: string; title: string; description: string; content: string; isPublished: boolean; showIn: AdminPage['showIn'] };

const EMPTY: Form = { slug: '', title: '', description: '', content: '', isPublished: false, showIn: '' };

const slugify = (text: string) =>
  text.toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

/**
 * A standalone page at its own address. Unlike a post's, the address can change later: the page
 * moves, and the old address stops answering. The API refuses addresses the site already uses.
 */
function Editor({ slug }: { slug: string }) {
  const isNew = slug === 'new';
  const { call, refreshSite } = useAdmin();
  const router = useRouter();
  const [original, setOriginal] = useState<Form | null>(isNew ? EMPTY : null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isSlugTouched, setIsSlugTouched] = useState(!isNew);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(takeFlash);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [isPickingImage, setIsPickingImage] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isNew) return;
    call<AdminPage>('GetPageForEdit', { slug })
      .then((page) => {
        const loaded: Form = { slug: page.slug, title: page.title, description: page.description, content: page.content, isPublished: page.isPublished, showIn: page.showIn ?? '' };
        setOriginal(loaded);
        setForm(loaded);
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [call, slug, isNew]);

  const dirty = useMemo(() => !!original && JSON.stringify(form) !== JSON.stringify(original), [form, original]);
  useLeaveGuard(dirty);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setStatus(null);
    setForm((f) => ({ ...f, [key]: value, ...(key === 'title' && !isSlugTouched ? { slug: slugify(String(value)) } : {}) }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('save');
    setStatus(null);
    try {
      const result = await call<SaveResult>('SavePage', { ...form, originalSlug: isNew ? '' : slug });
      setOriginal(form);
      const tags = ['pages', `page:${result.id}`, ...(isNew || result.id === slug ? [] : [`page:${slug}`])];
      const refreshed = await ensureRefreshed(result, tags, refreshSite);
      if (result.id !== slug) {
        // New, or moved to a new address: open it there.
        setFlash({ kind: 'success', text: savedMessage(refreshed) });
        router.replace(`/admin/pages/${result.id}`);
      } else {
        setStatus({ kind: 'success', text: savedMessage(refreshed) });
      }
    } catch (err) {
      setStatus({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${form.title}”? /${slug} stops answering. This can't be undone.`)) return;
    setBusy('delete');
    try {
      const result = await call<SaveResult | null>('DeletePage', { slug });
      await ensureRefreshed(result, ['pages', `page:${slug}`], refreshSite);
      setOriginal(form);
      router.replace('/admin/pages');
    } catch (err) {
      setStatus({ kind: 'error', text: errorMessage(err) });
      setBusy(null);
    }
  };

  if (loadError) return <Notice>{loadError}</Notice>;
  if (!original) return <Spinner />;

  return (
    <form onSubmit={save}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="glass space-y-4 p-5 md:p-6">
          <Field label="Title">
            <input required maxLength={120} value={form.title} onChange={(e) => set('title', e.target.value)} className={`${fieldClass} text-lg font-semibold`} />
          </Field>
          <Field label="Description" hint={`${form.description.length}/300 · under the title, in search results and link previews`}>
            <textarea maxLength={300} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${fieldClass} resize-y`} />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Content (HTML)</span>
              <button type="button" onClick={() => setIsPickingImage(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/40 hover:bg-primary/10">
                <ImagePlus className="h-3.5 w-3.5" /> Insert image
              </button>
              <div role="tablist" className="glass-inset flex gap-1 rounded-full p-0.5 text-xs">
                {(['write', 'preview'] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('rounded-full px-3 py-1 font-medium capitalize', tab === t ? 'bg-primary text-primary-foreground' : 'text-foreground/70')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {isPickingImage && (
              <ImagePicker
                onClose={() => setIsPickingImage(false)}
                onInsert={(html) => {
                  const el = contentRef.current;
                  const at = el && tab === 'write' ? el.selectionStart : form.content.length;
                  set('content', `${form.content.slice(0, at)}\n${html}\n${form.content.slice(at)}`);
                  setIsPickingImage(false);
                }}
              />
            )}
            {tab === 'write' ? (
              <textarea
                ref={contentRef}
                required
                aria-label="Content (HTML)"
                spellCheck={false}
                rows={22}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                placeholder={'<h2>My setup</h2>\n<p>What I use every day…</p>'}
                className={`${fieldClass} resize-y font-mono text-[13px] leading-relaxed`}
              />
            ) : (
              <iframe title="Preview" sandbox="" srcDoc={previewDoc(form.content)} className="h-[34rem] w-full rounded-xl bg-white ring-1 ring-foreground/10" />
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;pre&gt; and images. Scripts, event handlers, inline styles and iframes are removed on save.
            </p>
          </div>
        </div>

        <aside className="glass h-fit space-y-4 p-5">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            Published
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
          </label>
          <Field label="Address" hint={`The page lives at /${form.slug || 'your-address'}. Changing it later moves the page.`}>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm text-muted-foreground">/</span>
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={64}
                value={form.slug}
                onChange={(e) => {
                  setIsSlugTouched(true);
                  set('slug', e.target.value);
                }}
                className={`${fieldClass} font-mono text-sm`}
              />
            </div>
          </Field>
          <Field label="Link it from" hint="Besides the sitemap, which lists every published page.">
            <select value={form.showIn} onChange={(e) => set('showIn', e.target.value as Form['showIn'])} className={fieldClass}>
              <option value="">Nowhere else</option>
              <option value="footer">The footer</option>
              <option value="menu">The Work menu</option>
            </select>
          </Field>
          {!isNew && original.isPublished && (
            <Link href={`/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View on the site <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </aside>
      </div>

      <SaveBar busy={busy} dirty={dirty} status={status} onDelete={isNew ? undefined : remove} />
    </form>
  );
}

export default function PageEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <AdminShell
      title={slug === 'new' ? 'New page' : 'Edit page'}
      actions={
        <Link href="/admin/pages" className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> All pages
        </Link>
      }
    >
      <Editor key={slug} slug={slug} />
    </AdminShell>
  );
}
