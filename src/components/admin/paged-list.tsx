'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { Paged } from '@/lib/admin/types';
import { useAdmin } from '@/components/admin/session';
import { cn } from '@/lib/utils';
import { fieldClass } from '@/components/admin/ui';

/**
 * One page of an admin list, loaded from the API with server-side paging and
 * search. Changing the search text or a filter goes back to page 1; typing is
 * debounced so the API isn't called on every key.
 */
export function usePaged<T>(action: string, filters: Record<string, string>, pageSize = 20) {
  const { call } = useAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [query, filterKey]);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    call<Paged<T>>(action, { ...JSON.parse(filterKey), search: query, page, pageSize })
      .then((result) => {
        if (!alive) return;
        setData(result);
        setError('');
        // A deletion can leave the last page empty: step back to the new last page.
        if (result.items.length === 0 && page > result.totalPages) setPage(result.totalPages);
      })
      .catch((e) => alive && setError(errorMessage(e)))
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, [call, action, filterKey, query, page, pageSize, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, isLoading, page, setPage, search, setSearch, reload };
}

/** Search box plus optional filter tabs, above a paged list. */
export function ListToolbar<K extends string>({
  search,
  onSearch,
  placeholder,
  tabs,
  active,
  onTab,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  tabs?: { key: K; label: string; count?: number }[];
  active?: K;
  onTab?: (key: K) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="relative block w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <span className="sr-only">{placeholder}</span>
        <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className={`${fieldClass} pl-9`} />
      </label>
      {tabs && onTab && (
        <div role="tablist" className="glass glass-pill flex max-w-full gap-1 overflow-x-auto p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active === t.key}
              onClick={() => onTab(t.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                active === t.key ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:bg-foreground/10 hover:text-foreground',
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && <span className="rounded-full bg-foreground/15 px-1.5 text-xs tabular-nums">{t.count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "21–40 of 87" with previous/next and nearby page numbers. Hidden when everything fits on one page. */
export function Pager({ data, onPage, isLoading }: { data: Paged<unknown> | null; onPage: (page: number) => void; isLoading?: boolean }) {
  if (!data || data.totalCount === 0) return null;
  const { page, pageSize, totalCount, totalPages } = data;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(totalCount, page * pageSize);
  const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages])).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const button = 'flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm tabular-nums transition-colors disabled:opacity-40';

  return (
    <nav aria-label="Pages" className={cn('flex flex-wrap items-center justify-between gap-3 pt-1', isLoading && 'opacity-60')}>
      <p className="text-sm tabular-nums text-muted-foreground">
        {from}–{to} of {totalCount.toLocaleString('en-US')}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className={cn(button, 'hover:bg-foreground/10')}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
              <button
                type="button"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
                className={cn(button, p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-foreground/10')}
              >
                {p}
              </button>
            </span>
          ))}
          <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={cn(button, 'hover:bg-foreground/10')}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
