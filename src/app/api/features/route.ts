import { NextRequest, NextResponse } from 'next/server';
import { queryRegistry, getRegistryStats, type RegistryItemType } from '@/lib/featureBible';
import type { FeatureStatus } from '@/lib/featureStatus';

/**
 * Feature Hub query API.
 *   GET /api/features?stats=1                 -> registry totals + category list
 *   GET /api/features?q=&category=&type=&status=&page=&pageSize=
 *                                             -> paginated, filtered items
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('stats') === '1') {
    return NextResponse.json({ data: getRegistryStats() });
  }

  const page = Number(searchParams.get('page') || '1') || 1;
  const pageSize = Math.min(60, Number(searchParams.get('pageSize') || '30') || 30);

  const result = queryRegistry({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    type: (searchParams.get('type') as RegistryItemType | 'all') || 'all',
    status: (searchParams.get('status') as FeatureStatus['status'] | 'all') || 'all',
    page,
    pageSize,
  });

  return NextResponse.json({ data: result });
}
