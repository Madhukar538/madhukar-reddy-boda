'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/admin/api';
import type { Post, SaveResult } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { SaveBar, setFlash, takeFlash, fromInputDate, savedMessage, toInputDate, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Field, Notice, Spinner, fieldClass, splitList } from '@/components/admin/ui';

type Form = { slug: string; title: string; excerpt: string; content: string; date: string; category: string; tags: string; isPublished: boolean };

const slugify = (text: string) =>
  text.toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96);

const today = () => new Date().toISOString().slice(0, 10);

const toForm = (post: Post): Form => ({
  slug: post.id,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  date: toInputDate(post.date),
  category: post.category,
  tags: post.tags.join(', '),
  isPublished: post.isPublished,
});

const EMPTY: Form = { slug: '', title: '', excerpt: '', content: '', date: today(), category: '', tags: '', isPublished: false };

// The preview runs in a sandboxed frame with scripts off, so even unsaved,
// unsanitised HTML can't touch the admin page. The API sanitises on save.
const previewDoc = (html: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{font:16px/1.7 system-ui,sans-serif;color:#1d1d1f;background:#fff;max-width:720px;margin:0 auto;padding:24px}
@media (prefers-color-scheme:dark){body{color:#f5f5f7;background:#1c1c1e}a{color:#64a8ff}}
h2{font-size:1.5em;margin:1.6em 0 .5em}h3{font-size:1.2em;margin:1.4em 0 .4em}
pre{background:rgba(127,127,127,.12);padding:12px;border-radius:10px;overflow:auto;font-size:13px}
code{font-family:ui-monospace,monospace;font-size:.9em}img{max-width:100%}
blockquote{margin:1em 0;padding:.6em 1em;border-left:3px solid #3b82f6;background:rgba(59,130,246,.08);border-radius:6px}
table{border-collapse:collapse}td,th{border:1px solid rgba(127,127,127,.3);padding:4px 8px}
</style></head><body>${html}</body></html>`;

function Editor({ slug }: { slug: string }) {
  const isNew = slug === 'new';
  const { call } = useAdmin();
  const router = useRouter();
  const [original, setOriginal] = useState<Form | null>(isNew ? EMPTY : null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(takeFlash);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  useEffect(() => {
    if (isNew) return;
    call<Post[]>('GetAllPosts')
      .then((posts) => {
        const post = posts.find((p) => p.id === slug);
        if (!post) return setLoadError('This post no longer exists.');
        const loaded = toForm(post);
        setOriginal(loaded);
        setForm(loaded);
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [call, slug, isNew]);

  const dirty = useMemo(() => !!original && JSON.stringify(form) !== JSON.stringify(original), [form, original]);
  useLeaveGuard(dirty);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setStatus(null);
    setForm((f) => ({ ...f, [key]: value, ...(key === 'title' && isNew && !slugTouched ? { slug: slugify(String(value)) } : {}) }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('save');
    setStatus(null);
    try {
      const result = await call<SaveResult>('SavePost', {
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        date: fromInputDate(form.date),
        category: form.category,
        tags: splitList(form.tags),
        isPublished: form.isPublished,
      });
      setOriginal(form);
      setStatus({ kind: 'success', text: savedMessage(result) });
      if (isNew) {
        setFlash({ kind: 'success', text: savedMessage(result) });
        router.replace(`/admin/posts/${result.id}`);
      }
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${form.title}”? This can't be undone.`)) return;
    setBusy('delete');
    try {
      await call('DeletePost', { id: slug });
      setOriginal(form); // nothing left to lose
      router.replace('/admin/posts');
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
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
            <input required maxLength={200} value={form.title} onChange={(e) => set('title', e.target.value)} className={`${fieldClass} text-lg font-semibold`} />
          </Field>
          <Field label="Excerpt" hint={`${form.excerpt.length}/500 · shown on cards, in search results and social previews`}>
            <textarea maxLength={500} rows={3} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={`${fieldClass} resize-y`} />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Content (HTML)</span>
              <div role="tablist" className="glass-inset flex gap-1 rounded-full p-0.5 text-xs">
                {(['write', 'preview'] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('rounded-full px-3 py-1 font-medium capitalize', tab === t ? 'bg-primary text-primary-foreground' : 'text-foreground/70')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {tab === 'write' ? (
              <textarea
                required
                aria-label="Content (HTML)"
                spellCheck={false}
                rows={24}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                className={`${fieldClass} resize-y font-mono text-[13px] leading-relaxed`}
              />
            ) : (
              <iframe title="Preview" sandbox="" srcDoc={previewDoc(form.content)} className="h-[36rem] w-full rounded-xl bg-white ring-1 ring-foreground/10" />
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt; and &lt;pre class=&quot;language-csharp&quot;&gt;. A callout is a blockquote whose first paragraph starts with [!tip] Title.
              Scripts, event handlers, inline styles and iframes are removed on save.
            </p>
          </div>
        </div>

        <aside className="glass h-fit space-y-4 p-5">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            Published
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
          </label>
          <Field label="Slug" hint={isNew ? 'The URL: /blog/your-slug' : "Fixed once published, so links don't break."}>
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={96}
              readOnly={!isNew}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
              className={`${fieldClass} font-mono text-sm ${isNew ? '' : 'opacity-70'}`}
            />
          </Field>
          <Field label="Date">
            <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Category">
            <input required maxLength={60} list="post-categories" value={form.category} onChange={(e) => set('category', e.target.value)} className={fieldClass} />
            <datalist id="post-categories">
              {['Software Architecture', 'Artificial Intelligence', 'DevOps', 'Observability'].map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="Tags" hint="Comma-separated, up to 12">
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className={fieldClass} placeholder=".NET, Redis, k6" />
          </Field>
          {!isNew && original.isPublished && (
            <Link href={`/blog/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View on the site <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </aside>
      </div>

      <SaveBar busy={busy} dirty={dirty} status={status} onDelete={isNew ? undefined : remove} />
    </form>
  );
}

export default function PostEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <AdminShell
      title={slug === 'new' ? 'New post' : 'Edit post'}
      actions={
        <Link href="/admin/posts" className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
      }
    >
      <Editor key={slug} slug={slug} />
    </AdminShell>
  );
}
