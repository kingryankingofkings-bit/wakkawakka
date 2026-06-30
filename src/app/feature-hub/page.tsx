import Link from 'next/link';
import { ArrowLeft, Wand2, Lightbulb, Sparkles, CheckCircle2, CircleDashed, Layers } from 'lucide-react';
import { getRegistryStats } from '@/lib/featureBible';
import { FeatureExplorer } from '@/components/feature-hub/FeatureExplorer';

export const metadata = {
  title: 'Feature Hub · Wakka Wakka',
  description:
    'Every researched feature, Wakka Wakka improvement, and original innovation from the Social Media Feature Bible — searchable and status-tracked.',
};

export default function FeatureHubPage() {
  const stats = getRegistryStats();
  const live = stats.statusCounts.live || 0;
  const beta = stats.statusCounts.beta || 0;
  const planned = stats.statusCounts.planned || 0;

  return (
    <div className="space-y-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      {/* Hero */}
      <header className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card/40 to-purple-500/10 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Social Media Feature Bible
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Wakka Wakka Feature Hub</h1>
        <p className="text-muted-foreground max-w-2xl">
          The complete catalog synthesized from 25 platforms: every researched feature, its tailored
          Wakka Wakka improvement, and 100 original innovations — all searchable, filterable, and
          tracked by real build status.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <StatCard icon={Wand2} label="Master features" value={stats.totals.features} />
          <StatCard icon={Sparkles} label="WW improvements" value={stats.totals.improvements} />
          <StatCard icon={Lightbulb} label="Innovations" value={stats.totals.innovations} />
          <StatCard icon={CheckCircle2} label="Live" value={live} tone="success" />
          <StatCard icon={Layers} label="Beta" value={beta} tone="warning" />
          <StatCard icon={CircleDashed} label="Planned" value={planned} tone="muted" />
        </div>
      </header>

      {/* Category overview */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          10 categories · {stats.totals.all.toLocaleString()} total items
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {stats.categories.map((c) => (
            <div
              key={c.slug}
              className="rounded-xl border border-border bg-card/40 p-3 text-xs"
            >
              <p className="font-semibold leading-tight mb-1 line-clamp-2">{c.name}</p>
              <p className="text-muted-foreground">
                {c.featureCount} features · {c.innovationCount} innovations
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Explorer */}
      <section>
        <FeatureExplorer categories={stats.categories} />
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning' | 'muted';
}) {
  const toneMap = {
    default: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    muted: 'text-muted-foreground',
  };
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-3">
      <Icon className={`h-4 w-4 mb-1.5 ${toneMap[tone]}`} />
      <p className="text-xl font-bold leading-none">{value.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}
