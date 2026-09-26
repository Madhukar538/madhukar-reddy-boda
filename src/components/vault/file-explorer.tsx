import Link from 'next/link';
import type { ReactNode } from 'react';
import { clientProjects, keyProjects, rdProjects, type Status } from '@/data/profile';
import { posts } from '@/lib/blog';
import { anchorId } from '@/lib/utils';

type File = { title: string; href: string };

const STATUS_FOLDERS: [Status, string][] = [
  ['SHIPPED', 'Shipped'],
  ['WIP', 'In progress'],
  ['POC', 'Proofs of concept'],
  ['RESEARCH', 'Research'],
];

function Folder({ name, count, open, children }: { name: string; count: number; open?: boolean; children: ReactNode }) {
  return (
    <details className="vault-folder" open={open}>
      <summary>
        <span className="truncate">{name}</span>
        <span className="ml-auto pl-2 text-[11px] tabular-nums text-muted-foreground">{count}</span>
      </summary>
      <div className="vault-folder-body">{children}</div>
    </details>
  );
}

function Files({ files }: { files: File[] }) {
  return (
    <ul>
      {files.map((file) => (
        <li key={file.href}>
          <Link href={file.href} className="vault-file" title={file.title}>
            <span className="truncate">{file.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Obsidian's file explorer: the whole site as a vault of folders and notes.
 * Native <details> folders, so it works without JavaScript.
 */
export function FileExplorer() {
  const categories = [...new Set(posts.map((p) => p.category))];
  const project = (p: { title: string }) => ({ title: p.title, href: `/projects#${anchorId(p.title)}` });

  return (
    <nav aria-label="Vault" className="glass p-3 text-sm">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Vault</p>
      <Folder name="Blog" count={posts.length} open>
        {categories.map((category) => {
          const list = posts.filter((p) => p.category === category);
          return (
            <Folder key={category} name={category} count={list.length}>
              <Files files={list.map((p) => ({ title: p.title, href: `/blog/${p.slug}` }))} />
            </Folder>
          );
        })}
      </Folder>
      <Folder name="Projects" count={keyProjects.length + clientProjects.length}>
        <Folder name="Featured" count={keyProjects.filter((p) => p.featured).length}>
          <Files files={keyProjects.filter((p) => p.featured).map(project)} />
        </Folder>
        <Folder name="More systems" count={keyProjects.filter((p) => !p.featured).length}>
          <Files files={keyProjects.filter((p) => !p.featured).map(project)} />
        </Folder>
        <Folder name="Clients" count={clientProjects.length}>
          <Files files={clientProjects.map(project)} />
        </Folder>
      </Folder>
      <Folder name="Lab" count={rdProjects.length}>
        {STATUS_FOLDERS.map(([status, name]) => {
          const list = rdProjects.filter((p) => p.status === status);
          return (
            <Folder key={status} name={name} count={list.length}>
              <Files files={list.map((p) => ({ title: p.title, href: `/lab#${anchorId(p.title)}` }))} />
            </Folder>
          );
        })}
      </Folder>
    </nav>
  );
}
