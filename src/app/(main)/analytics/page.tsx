'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, Users, FileDown, DollarSign, Gift, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatCount, formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const DATE_RANGES = ['7d', '30d', '90d'] as const;
type DateRange = typeof DATE_RANGES[number];

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No data available</div>;
  const max = Math.max(...data.map(d => d.value), 1);
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
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
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
            <span className="text-xs font-semibold ml-auto">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SvgLineChart({ data }: { data: { date: string; amount: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">No earnings data for this period.</div>;
  }
  const max = Math.max(...data.map(d => d.amount), 1);
  const width = 500;
  const height = 150;
  const padding = 25;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (d.amount / max) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-x-auto bg-card border border-border rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-3">Daily Earnings Trend</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-border" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-border" strokeWidth="1" />
        
        {/* Polyline */}
        <polyline
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="3"
          points={points}
        />
        
        {/* Data Points */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - (d.amount / max) * (height - 2 * padding);
          return (
            <g key={i} className="group">
              <circle
                cx={x}
                cy={y}
                r="4"
                className="fill-background stroke-primary hover:fill-primary transition-colors cursor-pointer"
                strokeWidth="2"
              />
              <title>{`${d.date}: ${formatCurrency(d.amount)}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between px-5 text-[10px] text-muted-foreground mt-2">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview');
  const [advancedSubTab, setAdvancedSubTab] = useState<'sales' | 'tips' | 'subs'>('sales');
  const [range, setRange] = useState<DateRange>('7d');

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/creator/analytics?range=${range}`, {
      headers: {
        'x-user-id': useAuthStore.getState().user?.id || '',
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setAnalyticsData(json.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [range]);

  const summary = analyticsData?.summary || {
    totalRevenue: 0,
    salesRevenue: 0,
    tipsRevenue: 0,
    subRevenue: 0,
    salesCount: 0,
    subCount: 0,
    tipsCount: 0,
    followerGrowth: 0,
    totalFollowers: 0,
    avgEngagementRate: 0,
    totalViews: 0
  };

  const dailyEarnings = analyticsData?.dailyEarnings || [];
  const transactions = analyticsData?.transactions || [];
  const topPosts = analyticsData?.topPosts || [];

  const locationSplit = Object.entries(analyticsData?.demographics?.location || {}).map(([loc, count]) => {
    const total = summary.totalFollowers || 1;
    const pct = Math.round(((count as number) / total) * 100);
    return { country: loc, pct: pct || 0 };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);

  const genderData = [
    { label: 'Male', value: analyticsData?.demographics?.gender?.Male || 0, color: '#3b82f6' },
    { label: 'Female', value: analyticsData?.demographics?.gender?.Female || 0, color: '#ec4899' },
    { label: 'Other', value: analyticsData?.demographics?.gender?.Other || 0, color: '#8b5cf6' },
  ];

  const contentTypes = [
    { label: 'Images', value: 45, color: '#3b82f6' },
    { label: 'Video', value: 30, color: '#8b5cf6' },
    { label: 'Text', value: 15, color: '#22c55e' },
    { label: 'Reels', value: 10, color: '#f97316' },
  ];

  const filteredTransactions = transactions.filter((t: any) => {
    if (advancedSubTab === 'sales') return t.type === 'sale';
    if (advancedSubTab === 'tips') return t.type === 'tip';
    return t.type === 'subscription';
  });

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className="flex bg-muted rounded-full p-0.5 border border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold transition-all',
                activeTab === 'overview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold transition-all',
                activeTab === 'advanced' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Creator Earnings Hub
            </button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('CSV export started!')}>
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Date range filter */}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : activeTab === 'overview' ? (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Views', value: summary.totalViews, trend: 12.5, icon: Eye },
                { label: 'Follower Growth', value: summary.followerGrowth, trend: 8.3, icon: Users },
                { label: 'Engagement Rate', value: `${summary.avgEngagementRate}%`, trend: 2.1, icon: TrendingUp },
                { label: 'Total Followers', value: summary.totalFollowers, trend: 22.4, icon: Award },
              ].map(({ label, value, trend, icon: Icon }) => (
                <Card key={label} padding="md">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{typeof value === 'number' ? formatCount(value) : value}</p>
                  <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', 'text-green-500')}>
                    <TrendingUp className="h-3 w-3" />
                    Live database update
                  </div>
                </Card>
              ))}
            </div>

            {/* Demographics section */}
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
                {locationSplit.length === 0 || (locationSplit.length === 1 && locationSplit[0].country === 'Global' && locationSplit[0].pct === 0) ? (
                  <p className="text-xs text-muted-foreground">No location data yet.</p>
                ) : (
                  locationSplit.map(({ country, pct }) => (
                    <div key={country} className="flex items-center gap-3">
                      <span className="text-sm w-40 truncate">{country}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{pct}%</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top posts */}
            <div>
              <h3 className="font-semibold mb-4">Top Performing Posts</h3>
              <div className="space-y-3">
                {topPosts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground bg-card border border-border rounded-xl">
                    No posts available yet.
                  </div>
                ) : (
                  topPosts.map((post: any, i: number) => (
                    <Card key={post.id} padding="md">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{post.content || '[Media Post]'}</p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatCount(post.likes)} likes</span>
                            <span>{formatCount(post.comments)} comments</span>
                            <span>{formatCount(post.views)} views</span>
                            <span className="text-primary font-bold">{post.engagementRate}% ER</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          /* Advanced Creator Earnings Hub */
          <div className="space-y-6">
            {/* SVG Line Chart */}
            <SvgLineChart data={dailyEarnings} />

            {/* Earnings breakdown grid */}
            <div className="grid grid-cols-3 gap-3">
              <Card padding="sm" className="text-center space-y-1">
                <DollarSign className="h-5 w-5 mx-auto text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Sales</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(summary.salesRevenue)}</p>
                <p className="text-[9px] text-muted-foreground">{summary.salesCount} purchases</p>
              </Card>
              <Card padding="sm" className="text-center space-y-1">
                <Gift className="h-5 w-5 mx-auto text-purple-500" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Tips</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(summary.tipsRevenue)}</p>
                <p className="text-[9px] text-muted-foreground">{summary.tipsCount} tips</p>
              </Card>
              <Card padding="sm" className="text-center space-y-1">
                <Award className="h-5 w-5 mx-auto text-success" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Subscriptions</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(summary.subRevenue)}</p>
                <p className="text-[9px] text-muted-foreground">{summary.subCount} active</p>
              </Card>
            </div>

            {/* Live Creator Earnings Hub Dashboard */}
            <Card padding="none" className="overflow-hidden border border-border">
              <div className="flex border-b border-border bg-muted/30">
                <button
                  onClick={() => setAdvancedSubTab('sales')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold transition-all border-b-2',
                    advancedSubTab === 'sales' ? 'border-primary text-primary bg-card' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Sales Transactions
                </button>
                <button
                  onClick={() => setAdvancedSubTab('tips')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold transition-all border-b-2',
                    advancedSubTab === 'tips' ? 'border-primary text-primary bg-card' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Tips Received
                </button>
                <button
                  onClick={() => setAdvancedSubTab('subs')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold transition-all border-b-2',
                    advancedSubTab === 'subs' ? 'border-primary text-primary bg-card' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Subscriptions
                </button>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    No transactions found for this sub-tab.
                  </div>
                ) : (
                  filteredTransactions.map((tx: any) => (
                    <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/10">
                      <div>
                        <p className="font-semibold text-foreground">{tx.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString()}
                        </p>
                        {tx.message && <p className="text-[10px] text-primary mt-0.5">&quot;{tx.message}&quot;</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{formatCurrency(tx.amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
