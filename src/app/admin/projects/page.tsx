'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import { KIND_LABELS, type Project, type ProjectKind } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { Notice, Panel, Spinner } from '@/components/admin/ui';

function ProjectList() {
  const { call } = useAdmin();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    call<Project[]>('GetAllProjects', { kind: '' }).then(setProjects).catch((e) => setError(errorMessage(e)));
  }, [call]);

  if (error) return <Notice>{error}</Notice>;
  if (!projects) return <Spinner />;

  return (
    <div className="space-y-5">
      {(Object.keys(KIND_LABELS) as ProjectKind[]).map((kind) => {
        const list = projects.filter((p) => p.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <Panel key={kind} title={KIND_LABELS[kind]} description={`${list.length} ${list.length === 1 ? 'item' : 'items'}, in display order`}>
            <div className="-mx-2 divide-y divide-foreground/10">
              {list.map((p) => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2.5 hover:bg-foreground/[0.04]">
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{p.sortOrder}</span>
                  <span className="min-w-0 flex-1 font-medium">{p.title}</span>
                  {p.isFeatured && <Star className="h-4 w-4 fill-current text-[hsl(var(--sys-orange))]" aria-label="Featured" />}
                  {p.kind === 'lab' && <span className="chip">{p.status}</span>}
                  {p.kind === 'client' && <span className="text-sm text-muted-foreground">{p.duration}</span>}
                  {!p.isPublished && <span className="chip chip-orange">Hidden</span>}
                </Link>
              ))}
              {list.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">None yet.</p>}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AdminShell
      title="Projects"
      actions={
        <Link href="/admin/projects/new" className="tinted-button">
          <Plus className="h-4 w-4" /> New project
        </Link>
      }
    >
      <ProjectList />
    </AdminShell>
  );
}
