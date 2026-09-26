'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import { KIND_LABELS, LAB_STATUSES, type Post, type Project, type ProjectKind, type SaveResult } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { SaveBar, setFlash, takeFlash, savedMessage, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Field, Notice, Spinner, fieldClass, splitLines, splitList } from '@/components/admin/ui';

type Form = Omit<Project, 'tech' | 'responsibilities' | 'updatedAt'> & { tech: string; responsibilities: string };

const EMPTY: Form = {
  id: '', kind: 'key', title: '', description: '', tech: '', post: '', isFeatured: false, outcome: '', status: 'WIP',
  client: '', role: '', duration: '', url: '', responsibilities: '', sortOrder: 0, isPublished: true,
};

const toForm = (p: Project): Form => ({ ...EMPTY, ...p, status: p.status || 'WIP', tech: p.tech.join(', '), responsibilities: p.responsibilities.join('\n') });

function Editor({ id }: { id: string }) {
  const isNew = id === 'new';
  const { call } = useAdmin();
  const router = useRouter();
  const [original, setOriginal] = useState<Form | null>(isNew ? EMPTY : null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(takeFlash);

  useEffect(() => {
    call<Post[]>('GetAllPosts').then((posts) => setSlugs(posts.map((p) => p.id))).catch(() => {});
    if (isNew) return;
    call<Project[]>('GetAllProjects', { kind: '' })
      .then((list) => {
        const project = list.find((p) => p.id === id);
        if (!project) return setLoadError('This project no longer exists.');
        setOriginal(toForm(project));
        setForm(toForm(project));
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [call, id, isNew]);

  const dirty = useMemo(() => !!original && JSON.stringify(form) !== JSON.stringify(original), [form, original]);
  useLeaveGuard(dirty);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setStatus(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('save');
    setStatus(null);
    try {
      const k = form.kind;
      // Fields that don't apply to this kind are sent empty.
      const result = await call<SaveResult>('SaveProject', {
        id: form.id,
        kind: k,
        title: form.title,
        description: form.description,
        tech: splitList(form.tech),
        post: k === 'client' ? '' : form.post.trim(),
        isFeatured: k === 'key' && form.isFeatured,
        outcome: k === 'key' ? form.outcome : '',
        status: k === 'lab' ? form.status : '',
        client: k === 'client' ? form.client : '',
        role: k === 'client' ? form.role : '',
        duration: k === 'client' ? form.duration : '',
        url: k === 'client' ? form.url.trim() : '',
        responsibilities: k === 'client' ? splitLines(form.responsibilities) : [],
        sortOrder: Number(form.sortOrder) || 0,
        isPublished: form.isPublished,
      });
      const saved = { ...form, id: result.id };
      setOriginal(saved);
      setForm(saved);
      setStatus({ kind: 'success', text: savedMessage(result) });
      if (isNew) {
        setFlash({ kind: 'success', text: savedMessage(result) });
        router.replace(`/admin/projects/${result.id}`);
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
      await call('DeleteProject', { id });
      setOriginal(form);
      router.replace('/admin/projects');
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
      setBusy(null);
    }
  };

  if (loadError) return <Notice>{loadError}</Notice>;
  if (!original) return <Spinner />;
  const k = form.kind;

  return (
    <form onSubmit={save}>
      <div className="glass grid grid-cols-1 gap-4 p-5 md:grid-cols-2 md:p-6">
        <Field label="Section" hint={isNew ? undefined : "Can't be changed after creation."}>
          <select value={k} disabled={!isNew} onChange={(e) => set('kind', e.target.value as ProjectKind)} className={fieldClass}>
            {(Object.keys(KIND_LABELS) as ProjectKind[]).map((kind) => (
              <option key={kind} value={kind}>{KIND_LABELS[kind]}</option>
            ))}
          </select>
        </Field>
        <Field label="Display order" hint="Lower numbers come first">
          <input type="number" min={0} max={9999} value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className={fieldClass} />
        </Field>
        <Field label="Title" className="md:col-span-2">
          <input required maxLength={160} value={form.title} onChange={(e) => set('title', e.target.value)} className={`${fieldClass} text-lg font-semibold`} />
        </Field>
        <Field label="Description" hint={`${form.description.length}/2000`} className="md:col-span-2">
          <textarea maxLength={2000} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${fieldClass} resize-y`} />
        </Field>
        <Field label="Technologies" hint="Comma-separated, up to 20" className="md:col-span-2">
          <input value={form.tech} onChange={(e) => set('tech', e.target.value)} className={fieldClass} placeholder=".NET, MongoDB, Redis" />
        </Field>

        {k === 'lab' && (
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={fieldClass}>
              {LAB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}

        {k !== 'client' && (
          <Field label="Write-up post" hint="Slug of the blog post about it (optional)">
            <input list="post-slugs" value={form.post} onChange={(e) => set('post', e.target.value)} className={`${fieldClass} font-mono text-sm`} />
            <datalist id="post-slugs">{slugs.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
        )}

        {k === 'key' && (
          <>
            <Field label="Outcome" hint="A short result, shown on featured cards" className="md:col-span-2">
              <input maxLength={300} value={form.outcome} onChange={(e) => set('outcome', e.target.value)} className={fieldClass} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
              Featured
            </label>
          </>
        )}

        {k === 'client' && (
          <>
            <Field label="Client"><input value={form.client} onChange={(e) => set('client', e.target.value)} className={fieldClass} /></Field>
            <Field label="Role"><input value={form.role} onChange={(e) => set('role', e.target.value)} className={fieldClass} /></Field>
            <Field label="Duration" hint='For example "2022 – 2023"'><input value={form.duration} onChange={(e) => set('duration', e.target.value)} className={fieldClass} /></Field>
            <Field label="Website" hint="https:// only (optional)"><input type="url" value={form.url} onChange={(e) => set('url', e.target.value)} className={fieldClass} /></Field>
            <Field label="What I did" hint="One item per line, up to 20" className="md:col-span-2">
              <textarea rows={6} value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} className={`${fieldClass} resize-y`} />
            </Field>
          </>
        )}

        <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
          Show on the site
        </label>
      </div>

      <SaveBar busy={busy} dirty={dirty} status={status} onDelete={isNew ? undefined : remove} />
    </form>
  );
}

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell
      title={id === 'new' ? 'New project' : 'Edit project'}
      actions={
        <Link href="/admin/projects" className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
      }
    >
      <Editor key={id} id={id} />
    </AdminShell>
  );
}
