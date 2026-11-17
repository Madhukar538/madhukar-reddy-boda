'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { KIND_LABELS, type Project, type ProjectKind } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { ListToolbar, Pager, usePaged } from '@/components/admin/paged-list';
import { Notice, Spinner } from '@/components/admin/ui';

type KindFilter = '' | ProjectKind;

const TABS: { key: KindFilter; label: string }[] = [
  { key: '', label: 'All' },
  ...(Object.keys(KIND_LABELS) as ProjectKind[]).map((key) => ({ key, label: KIND_LABELS[key] })),
];

function ProjectList() {
  const [kind, setKind] = useState<KindFilter>('');
  const { data, error, isLoading, setPage, search, setSearch } = usePaged<Project>('GetAllProjects', { kind });

  return (
    <div className="space-y-4">
      <ListToolbar search={search} onSearch={setSearch} placeholder="Search title, client or tech" tabs={TABS} active={kind} onTab={setKind} />
      {error && <Notice>{error}</Notice>}
      {!data ? (
        !error && <Spinner />
      ) : (
        <>
          <div className="glass divide-y divide-foreground/10 overflow-hidden">
            {data.items.map((p) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 transition-colors hover:bg-foreground/[0.04]">
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{p.sortOrder}</span>
                <span className="min-w-0 flex-1 font-medium">{p.title}</span>
                {p.isFeatured && <Star className="h-4 w-4 fill-current text-[hsl(var(--sys-orange))]" aria-label="Featured" />}
                {!kind && <span className="chip">{KIND_LABELS[p.kind]}</span>}
                {p.kind === 'lab' && <span className="chip">{p.status}</span>}
                {p.kind === 'client' && <span className="text-sm text-muted-foreground">{p.duration}</span>}
                {!p.isPublished && <span className="chip chip-orange">Hidden</span>}
              </Link>
            ))}
            {data.items.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No projects match.</p>}
          </div>
          <Pager data={data} onPage={setPage} isLoading={isLoading} />
        </>
      )}
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
