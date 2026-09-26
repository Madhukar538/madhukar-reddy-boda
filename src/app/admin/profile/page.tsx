'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { Profile, SaveResult } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { SaveBar, ensureRefreshed, savedMessage, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Field, Notice, Panel, Spinner, fieldClass, splitLines, splitList } from '@/components/admin/ui';

// Lists are edited as text (comma- or line-separated) and split on save,
// so typing a trailing comma or blank line never fights the input.
type Form = Omit<Profile, 'skillCategories' | 'experience' | 'updatedAt'> & {
  skillCategories: { title: string; color: string; skills: string }[];
  experience: Omit<Profile['experience'], 'groups'> & { groups: { label: string; items: string }[] };
};

const toForm = (p: Profile): Form => ({
  name: p.name, title: p.title, company: p.company, location: p.location, email: p.email, phone: p.phone, phoneHref: p.phoneHref,
  github: p.github, linkedin: p.linkedin, twitter: p.twitter, summary: p.summary,
  skillCategories: p.skillCategories.map((c) => ({ title: c.title, color: c.color || 'green', skills: c.skills.join(', ') })),
  experience: { ...p.experience, highlights: p.experience.highlights.map((h) => ({ ...h })), groups: p.experience.groups.map((g) => ({ label: g.label, items: g.items.join('\n') })) },
  education: { ...p.education },
});

const fromForm = (f: Form): Profile => ({
  ...f,
  skillCategories: f.skillCategories.filter((c) => c.title.trim()).map((c) => ({ title: c.title.trim(), color: c.color, skills: splitList(c.skills) })),
  experience: {
    ...f.experience,
    highlights: f.experience.highlights.filter((h) => h.label.trim() || h.value.trim()),
    groups: f.experience.groups.filter((g) => g.label.trim()).map((g) => ({ label: g.label.trim(), items: splitLines(g.items) })),
  },
});

const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

function ListItem({ index, count, onMove, onRemove, children }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; children: ReactNode }) {
  const icon = 'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-30';
  return (
    <div className="glass-inset flex gap-3 rounded-xl p-3">
      <div className="min-w-0 flex-1 space-y-3">{children}</div>
      <div className="flex shrink-0 flex-col">
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)} className={icon}><ArrowUp className="h-4 w-4" /></button>
        <button type="button" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)} className={icon}><ArrowDown className="h-4 w-4" /></button>
        <button type="button" aria-label="Remove" onClick={onRemove} className={icon}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

const addButton = 'inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline';

function ProfileEditor() {
  const { call, refreshSite } = useAdmin();
  const [original, setOriginal] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    call<Profile>('GetProfile')
      .then((p) => {
        setOriginal(toForm(p));
        setForm(toForm(p));
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [call]);

  const dirty = useMemo(() => !!form && JSON.stringify(form) !== JSON.stringify(original), [form, original]);
  useLeaveGuard(dirty);

  if (loadError) return <Notice>{loadError}</Notice>;
  if (!form) return <Spinner />;

  const update = (change: (f: Form) => Form) => {
    setStatus(null);
    setForm((f) => (f ? change(f) : f));
  };
  const text = (key: keyof Omit<Form, 'skillCategories' | 'experience' | 'education'>, label: string, props: Record<string, unknown> = {}) => (
    <Field label={label}>
      <input value={form[key]} onChange={(e) => update((f) => ({ ...f, [key]: e.target.value }))} className={fieldClass} {...props} />
    </Field>
  );
  const exp = form.experience;
  const setExp = (patch: Partial<Form['experience']>) => update((f) => ({ ...f, experience: { ...f.experience, ...patch } }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('save');
    setStatus(null);
    try {
      const result = await call<SaveResult>('SaveProfile', { profile: fromForm(form) });
      setOriginal(form);
      setStatus({ kind: 'success', text: savedMessage(await ensureRefreshed(result, ['profile'], refreshSite)) });
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <Panel title="About you">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {text('name', 'Name', { required: true, maxLength: 120 })}
          {text('title', 'Job title')}
          {text('company', 'Company')}
          {text('location', 'Location')}
          <Field label="Summary" hint={`${form.summary.length}/2000`} className="md:col-span-2">
            <textarea rows={4} maxLength={2000} value={form.summary} onChange={(e) => update((f) => ({ ...f, summary: e.target.value }))} className={`${fieldClass} resize-y`} />
          </Field>
        </div>
      </Panel>

      <Panel title="Contact and links" description="Profile links must be https:// addresses. Leave LinkedIn or Twitter empty to hide them.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {text('email', 'Email', { type: 'email' })}
          {text('phone', 'Phone (as shown)')}
          {text('phoneHref', 'Phone link', { placeholder: 'tel:+91…' })}
          {text('github', 'GitHub', { type: 'url' })}
          {text('linkedin', 'LinkedIn', { type: 'url' })}
          {text('twitter', 'Twitter / X', { type: 'url' })}
        </div>
      </Panel>

      <Panel title="Tech stack">
        <div className="space-y-3">
          {form.skillCategories.map((c, i) => (
            <ListItem
              key={i}
              index={i}
              count={form.skillCategories.length}
              onMove={(to) => update((f) => ({ ...f, skillCategories: move(f.skillCategories, i, to) }))}
              onRemove={() => update((f) => ({ ...f, skillCategories: f.skillCategories.filter((_, j) => j !== i) }))}
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                <Field label="Group">
                  <input value={c.title} onChange={(e) => update((f) => ({ ...f, skillCategories: f.skillCategories.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) }))} className={fieldClass} />
                </Field>
                <Field label="Colour">
                  <select value={c.color} onChange={(e) => update((f) => ({ ...f, skillCategories: f.skillCategories.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)) }))} className={fieldClass}>
                    <option value="green">Accent</option>
                    <option value="cyan">Teal</option>
                    <option value="amber">Orange</option>
                  </select>
                </Field>
              </div>
              <Field label="Skills" hint="Comma-separated">
                <input value={c.skills} onChange={(e) => update((f) => ({ ...f, skillCategories: f.skillCategories.map((x, j) => (j === i ? { ...x, skills: e.target.value } : x)) }))} className={fieldClass} />
              </Field>
            </ListItem>
          ))}
          <button type="button" className={addButton} onClick={() => update((f) => ({ ...f, skillCategories: [...f.skillCategories, { title: '', color: 'green', skills: '' }] }))}>
            <Plus className="h-4 w-4" /> Add a group
          </button>
        </div>
      </Panel>

      <Panel title="Current role">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(['title', 'company', 'duration', 'location', 'type'] as const).map((key) => (
            <Field key={key} label={{ title: 'Role', company: 'Company', duration: 'Duration', location: 'Location', type: 'Type' }[key]}>
              <input value={exp[key]} onChange={(e) => setExp({ [key]: e.target.value })} className={fieldClass} />
            </Field>
          ))}
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Highlights</h3>
        <div className="space-y-3">
          {exp.highlights.map((h, i) => (
            <ListItem key={i} index={i} count={exp.highlights.length} onMove={(to) => setExp({ highlights: move(exp.highlights, i, to) })} onRemove={() => setExp({ highlights: exp.highlights.filter((_, j) => j !== i) })}>
              <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                <Field label="Label"><input value={h.label} onChange={(e) => setExp({ highlights: exp.highlights.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={fieldClass} /></Field>
                <Field label="Text"><input value={h.value} onChange={(e) => setExp({ highlights: exp.highlights.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} className={fieldClass} /></Field>
              </div>
            </ListItem>
          ))}
          <button type="button" className={addButton} onClick={() => setExp({ highlights: [...exp.highlights, { label: '', value: '' }] })}>
            <Plus className="h-4 w-4" /> Add a highlight
          </button>
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Contributions</h3>
        <div className="space-y-3">
          {exp.groups.map((g, i) => (
            <ListItem key={i} index={i} count={exp.groups.length} onMove={(to) => setExp({ groups: move(exp.groups, i, to) })} onRemove={() => setExp({ groups: exp.groups.filter((_, j) => j !== i) })}>
              <Field label="Group"><input value={g.label} onChange={(e) => setExp({ groups: exp.groups.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={fieldClass} /></Field>
              <Field label="Items" hint="One per line">
                <textarea rows={4} value={g.items} onChange={(e) => setExp({ groups: exp.groups.map((x, j) => (j === i ? { ...x, items: e.target.value } : x)) })} className={`${fieldClass} resize-y`} />
              </Field>
            </ListItem>
          ))}
          <button type="button" className={addButton} onClick={() => setExp({ groups: [...exp.groups, { label: '', items: '' }] })}>
            <Plus className="h-4 w-4" /> Add a group
          </button>
        </div>
      </Panel>

      <Panel title="Education">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(['degree', 'institution', 'location'] as const).map((key) => (
            <Field key={key} label={{ degree: 'Degree', institution: 'Institution', location: 'Location' }[key]}>
              <input value={form.education[key]} onChange={(e) => update((f) => ({ ...f, education: { ...f.education, [key]: e.target.value } }))} className={fieldClass} />
            </Field>
          ))}
          <Field label="Description" className="md:col-span-2">
            <textarea rows={3} value={form.education.description} onChange={(e) => update((f) => ({ ...f, education: { ...f.education, description: e.target.value } }))} className={`${fieldClass} resize-y`} />
          </Field>
        </div>
      </Panel>

      <SaveBar busy={busy} dirty={dirty} status={status} />
    </form>
  );
}

export default function ProfilePage() {
  return (
    <AdminShell title="Profile">
      <ProfileEditor />
    </AdminShell>
  );
}
