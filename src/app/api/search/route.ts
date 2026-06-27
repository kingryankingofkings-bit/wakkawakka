import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS, MOCK_POSTS, MOCK_HASHTAGS, MOCK_COMMUNITIES } from '@/lib/mockData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  if (!q) {
    return NextResponse.json({
      data: { users: [], posts: [], hashtags: MOCK_HASHTAGS.filter(h => h.isTrending), communities: [] },
    });
  }

  const users = MOCK_USERS.filter(
    u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q) || (u.bio?.toLowerCase().includes(q))
  ).slice(0, 10);

  const posts = MOCK_POSTS.filter(
    p => p.content.toLowerCase().includes(q) || p.hashtags.some(h => h.toLowerCase().includes(q))
  ).slice(0, 10);

  const hashtags = MOCK_HASHTAGS.filter(h => h.name.toLowerCase().includes(q)).slice(0, 10);

  const communities = MOCK_COMMUNITIES.filter(
    c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  ).slice(0, 10);

  return NextResponse.json({ data: { users, posts, hashtags, communities } });
}
