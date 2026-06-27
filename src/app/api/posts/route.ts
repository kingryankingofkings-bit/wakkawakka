import { NextRequest, NextResponse } from 'next/server';
import { MOCK_POSTS } from '@/lib/mockData';
import { Post } from '@/types';

// In-memory store (reset on server restart)
let posts = [...MOCK_POSTS];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const userId = searchParams.get('userId');
  const hashtag = searchParams.get('hashtag');
  const feed = searchParams.get('feed');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  let filtered = [...posts];

  if (type) filtered = filtered.filter(p => p.type === type);
  if (userId) filtered = filtered.filter(p => p.authorId === userId);
  if (hashtag) filtered = filtered.filter(p => p.hashtags.includes(hashtag));
  if (feed === 'trending') filtered = filtered.sort((a, b) => b.viewsCount - a.viewsCount);
  if (feed === 'following') filtered = filtered.filter(p => p.author.isVerified);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return NextResponse.json({
    data,
    meta: { total, page, limit, hasMore: start + limit < total },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newPost: Post = {
      id: `post_${Date.now()}`,
      content: body.content || '',
      author: body.author,
      authorId: body.authorId,
      mediaUrls: body.mediaUrls || [],
      type: body.type || 'TEXT',
      visibility: body.visibility || 'PUBLIC',
      isEphemeral: body.isEphemeral || false,
      expiresAt: body.expiresAt,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      hashtags: body.hashtags || [],
      collaborators: body.collaborators || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    posts = [newPost, ...posts];
    return NextResponse.json({ data: newPost }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
