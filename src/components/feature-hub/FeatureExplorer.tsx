'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { FeatureCard, type RegistryItemDTO } from './FeatureCard';
import { cn } from '@/lib/utils';

interface CategoryDTO {
  index: number;
  name: string;
  slug: string;
  featureCount: number;
  innovationCount: number;
}

interface ExplorerProps {
  categories: CategoryDTO[];
  initialCategory?: string;
}

interface QueryResultDTO {
  items: RegistryItemDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: {
    statusCounts: Record<string, number>;
    typeCounts: Record<string, number>;
  };
}

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'feature', label: 'Features' },
  { id: 'innovation', label: 'Innovations' },
] as const;

const STATUS_FILTERS = [
  { id: 'all', label: 'All status' },
  { id: 'live', label: 'Live' },
  { id: 'beta', label: 'Beta' },
  { id: 'planned', label: 'Planned' },
] as const;

export function FeatureExplorer({ categories, initialCategory = 'all' }: ExplorerProps) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<QueryResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const reqId = useRef(0);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // reset to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, category, type, status]);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    const params = new URLSearchParams({
      q: debouncedQ,
      category,
      type,
      status,
      page: String(page),
      pageSize: '30',
    });
    try {
      const res = await fetch(`/api/features?${params.toString()}`);
      const json = await res.json();
      if (id === reqId.current) setResult(json.data);
    } catch {
      if (id === reqId.current) setResult(null);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debouncedQ, category, type, status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) + (type !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search + filter toggle */}
      <div className="flex items-center gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 2,264 features, improvements & innovations…"
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-border bg-card/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'h-11 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors',
            showFilters || activeFilterCount > 0
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((f) => (
                <Chip key={f.id} active={type === f.id} onClick={() => setType(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Build status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <Chip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={category === 'all'} onClick={() => setCategory('all')}>
                All categories
              </Chip>
              {categories.map((c) => (
                <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result meta */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {result ? (
            <>
              <span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> results
            </>
          ) : (
            'Loading…'
          )}
        </span>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {/* Grid */}
      {result && result.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {result.items.map((item) => (
            <FeatureCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold">No matches</p>
            <p className="text-sm">Try a different search or clear the filters.</p>
          </div>
        )
      )}

      {/* Pagination */}
      {result && result.pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 px-4 rounded-xl border border-border bg-card/60 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground px-2">
            Page {result.page} of {result.pageCount}
          </span>
          <button
            disabled={page >= result.pageCount}
            onClick={() => setPage((p) => Math.min(result.pageCount, p + 1))}
            className="h-9 px-4 rounded-xl border border-border bg-card/60 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40'
      )}
    >
      {children}
    </button>
  );
}
