'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, ArrowUpRight, Wand2, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface RegistryItemDTO {
  id: string;
  type: 'feature' | 'innovation';
  ordinal: number;
  category: string;
  categorySlug: string;
  title: string;
  description: string;
  platforms?: string[];
  enhancement?: string;
  whyItMatters?: string;
  impact?: string;
  status: 'live' | 'beta' | 'planned';
  href?: string;
  statusNote?: string;
}

const STATUS_META: Record<
  RegistryItemDTO['status'],
  { label: string; variant: 'success' | 'warning' | 'outline' }
> = {
  live: { label: 'Live', variant: 'success' },
  beta: { label: 'Beta', variant: 'warning' },
  planned: { label: 'Planned', variant: 'outline' },
};

export function FeatureCard({ item }: { item: RegistryItemDTO }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_META[item.status];
  const isInnovation = item.type === 'innovation';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0',
              isInnovation
                ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500'
                : 'bg-primary/10 text-primary'
            )}
          >
            {isInnovation ? <Lightbulb className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
          </div>
          <h3 className="font-semibold text-sm leading-tight truncate">{item.title}</h3>
        </div>
        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" size="sm">
          {item.category}
        </Badge>
        {isInnovation ? (
          <Badge variant="premium" size="sm">
            <Sparkles className="h-3 w-3" /> Innovation · {item.impact}
          </Badge>
        ) : (
          item.platforms?.slice(0, 2).map((p) => (
            <Badge key={p} variant="outline" size="sm">
              {p}
            </Badge>
          ))
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>

      {(item.enhancement || item.whyItMatters || item.statusNote) && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline self-start"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? 'Hide details' : 'Wakka Wakka details'}
        </button>
      )}

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 text-xs border-t border-border pt-3"
        >
          {item.enhancement && (
            <div>
              <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Wakka Wakka enhancement
              </p>
              <p className="text-muted-foreground">{item.enhancement}</p>
            </div>
          )}
          {item.whyItMatters && (
            <div>
              <p className="font-semibold text-foreground mb-0.5">Why it matters</p>
              <p className="text-muted-foreground">{item.whyItMatters}</p>
            </div>
          )}
          {item.statusNote && (
            <p className="text-muted-foreground italic">{item.statusNote}</p>
          )}
        </motion.div>
      )}

      {item.href && (
        <Link
          href={item.href}
          className="mt-auto inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors active:scale-95"
        >
          Open feature <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </motion.div>
  );
}
