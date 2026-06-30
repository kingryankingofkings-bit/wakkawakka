'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Eye, Users, BarChart2, FileDown, DollarSign, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatCount, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { MOCK_POSTS, CURRENT_USER } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { downloadCSV, downloadJSON } from '@/lib/exportData';
import toast from 'react-hot-toast';

const DATE_RANGES = ['7d', '30d', '90d'] as const;
type DateRange = typeof DATE_RANGES[number];

/** Deterministic pseudo-random in [0,1) from a string seed (stable across renders). */
function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function generateRevenue(range: DateRange) {
  const multiplier = range === '7d' ? 1 : range === '30d' ? 4.3 : 13;
  const sources = [
    { label: 'Subscriptions', value: Math.round(420 * multiplier), color: '#8b5cf6' },
    { label: 'Tips', value: Math.round(180 * multiplier), color: '#ec4899' },
    { label: 'Shop sales', value: Math.round(260 * multiplier), color: '#3b82f6' },
    { label: 'Creator bonus', value: Math.round(90 * multiplier), color: '#22c55e' },
  ];
  const total = sources.reduce((s, x) => s + x.value, 0);
  return { sources, total };
}

function generateStats(range: DateRange) {
  const multiplier = range === '7d' ? 1 : range === '30d' ? 4.3 : 13;
  return {
    impressions: Math.floor(12400 * multiplier),
    impressionsTrend: 12.5,
    reach: Math.floor(8900 * multiplier),
    reachTrend: 8.3,
    profileViews: Math.floor(1240 * multiplier),
    profileViewsTrend: -2.1,
    followerGrowth: Math.floor(48 * multiplier),
    followerGrowthTrend: 22.4,
  };
}

function generateBarData(range: DateRange): { label: string; value: number }[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 12;
  const labels = range === '90d'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, days)
    : Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
  return labels.map(label => ({ label, value: Math.floor(Math.random() * 5000 + 2000) }));
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors relative group-hover:z-10"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${formatCount(d.value)}`}
          />
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const dashArray = `${pct} ${100 - pct}`;
          const dashOffset = -offset;
          offset += pct;
          return (
            <circle
              key={i}
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <div className="space-y-1">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs">{seg.label}</span>
            <span className="text-xs font-semibold ml-auto">{Math.round(seg.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>('30d');
  const [exportOpen, setExportOpen] = useState(false);
  // barData is generated with randomness — memoize so it's stable per range.
  const stats = useMemo(() => generateStats(range), [range]);
  const barData = useMemo(() => generateBarData(range), [range]);
  const revenue = useMemo(() => generateRevenue(range), [range]);

  const topPosts = MOCK_POSTS.slice().sort((a, b) => b.likesCount - a.likesCount).slice(0, 3);

  function buildExportRows() {
    const summary = [
      { metric: 'Impressions', value: stats.impressions, trendPct: stats.impressionsTrend },
      { metric: 'Reach', value: stats.reach, trendPct: stats.reachTrend },
      { metric: 'Profile Views', value: stats.profileViews, trendPct: stats.profileViewsTrend },
      { metric: 'New Followers', value: stats.followerGrowth, trendPct: stats.followerGrowthTrend },
      ...revenue.sources.map((s) => ({ metric: `Revenue: ${s.label}`, value: s.value, trendPct: '' })),
      { metric: 'Revenue: Total', value: revenue.total, trendPct: '' },
    ];
    return summary;
  }

  function handleExport(format: 'csv' | 'json') {
    const rows = buildExportRows();
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      downloadCSV(`wakka-analytics-${range}-${stamp}.csv`, rows, ['metric', 'value', 'trendPct']);
    } else {
      downloadJSON(`wakka-analytics-${range}-${stamp}.json`, {
        range,
        generatedAt: new Date().toISOString(),
        summary: rows,
        timeseries: barData,
      });
    }
    setExportOpen(false);
    toast.success(`Exported ${format.toUpperCase()}`);
  }

  const contentTypes = [
    { label: 'Images', value: 45, color: '#3b82f6' },
    { label: 'Video', value: 30, color: '#8b5cf6' },
    { label: 'Text', value: 15, color: '#22c55e' },
    { label: 'Reels', value: 10, color: '#f97316' },
  ];

  const genderData = [
    { label: 'Male', value: 48, color: '#3b82f6' },
    { label: 'Female', value: 44, color: '#ec4899' },
    { label: 'Other', value: 8, color: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Analytics</h1>
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(v => !v)}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 mt-1 z-50 w-44 rounded-xl border border-border bg-card shadow-xl py-1">
                <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" /> Export as CSV
                </button>
                <button onClick={() => handleExport('json')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                  <FileJson className="h-4 w-4 text-amber-500" /> Export as JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Date range */}
        <div className="flex gap-2">
          {DATE_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                range === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Impressions', value: stats.impressions, trend: stats.impressionsTrend, icon: Eye },
            { label: 'Reach', value: stats.reach, trend: stats.reachTrend, icon: Users },
            { label: 'Profile Views', value: stats.profileViews, trend: stats.profileViewsTrend, icon: Eye },
            { label: 'New Followers', value: stats.followerGrowth, trend: stats.followerGrowthTrend, icon: TrendingUp },
          ].map(({ label, value, trend, icon: Icon }) => (
            <Card key={label} padding="md">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{formatCount(value)}</p>
              <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', trend > 0 ? 'text-green-500' : 'text-red-500')}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}% vs prev period
              </div>
            </Card>
          ))}
        </div>

        {/* Revenue breakdown */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" /> Revenue Breakdown
            </h3>
            <div className="text-right">
              <p className="text-xl font-bold">{formatCurrency(revenue.total)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">this period</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {revenue.sources.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm w-28 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.value / revenue.total) * 100}%`, backgroundColor: s.color }} />
                </div>
                <span className="text-sm font-semibold w-16 text-right">{formatCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Impressions chart */}
        <Card padding="md">
          <h3 className="font-semibold mb-4">Post Impressions</h3>
          <BarChart data={barData} />
          <div className="flex justify-between mt-2">
            {barData.filter((_, i) => i % Math.ceil(barData.length / 6) === 0).map(d => (
              <span key={d.label} className="text-xs text-muted-foreground">{d.label}</span>
            ))}
          </div>
        </Card>

        {/* Content performance & Audience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card padding="md">
            <h3 className="font-semibold mb-4">Content Breakdown</h3>
            <DonutChart segments={contentTypes} />
          </Card>
          <Card padding="md">
            <h3 className="font-semibold mb-4">Audience Gender</h3>
            <DonutChart segments={genderData} />
          </Card>
        </div>

        {/* Top locations */}
        <Card padding="md">
          <h3 className="font-semibold mb-4">Top Locations</h3>
          <div className="space-y-3">
            {[
              { country: '🇺🇸 United States', pct: 48 },
              { country: '🇬🇧 United Kingdom', pct: 12 },
              { country: '🇨🇦 Canada', pct: 9 },
              { country: '🇦🇺 Australia', pct: 8 },
              { country: '🇩🇪 Germany', pct: 6 },
            ].map(({ country, pct }) => (
              <div key={country} className="flex items-center gap-3">
                <span className="text-sm w-40">{country}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-medium w-10 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Best posting times */}
        <Card padding="md">
          <h3 className="font-semibold mb-4">Best Posting Times</h3>
          <div className="overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)', minWidth: '600px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="contents">
                  <div className="text-xs text-muted-foreground py-1 pr-2 flex items-center">{day}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const val = seededRandom(`${day}-${h}-${range}`);
                    return (
                      <div
                        key={h}
                        className="m-0.5 rounded-sm h-5"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${val > 0.7 ? 0.8 : val > 0.4 ? 0.4 : 0.1})` }}
                        title={`${day} ${h}:00 - ${Math.round(val * 100)}% engagement`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="grid mt-1" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)', minWidth: '600px' }}>
              <div />
              {[0, 6, 12, 18, 23].map(h => (
                <div key={h} className="text-xs text-muted-foreground" style={{ gridColumn: h + 2 }}>
                  {h}h
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top posts */}
        <div>
          <h3 className="font-semibold mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {topPosts.map((post, i) => (
              <Card key={post.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                    #{i + 1}
                  </div>
                  {post.mediaUrls[0] && (
                    <img src={post.mediaUrls[0]} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatCount(post.likesCount)} likes</span>
                      <span>{formatCount(post.commentsCount)} comments</span>
                      <span>{formatCount(post.viewsCount)} views</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
