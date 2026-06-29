import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// GET /api/albums?ownerId=xxx — list a user's albums (defaults to current user)
export async function GET(req: NextRequest) {
  const current = getRequestUserId(req);
  const ownerId = req.nextUrl.searchParams.get('ownerId') ?? current;
  if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });

  try {
    const albums = await prisma.album.findMany({
      where: { ownerId },
      include: {
        photos: { orderBy: { position: 'asc' }, take: 4 },
        _count: { select: { photos: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ data: albums, meta: { total: albums.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}

// POST /api/albums — create an album, optionally with initial photo URLs
// body: { name, description?, visibility?, photos?: string[] }
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, description, visibility, photos } = await req.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const urls: string[] = Array.isArray(photos) ? photos.filter((u: string) => typeof u === 'string' && u.trim()) : [];

    const album = await prisma.album.create({
      data: {
        ownerId: userId,
        name,
        description,
        visibility: visibility ?? 'PUBLIC',
        coverUrl: urls[0],
        photoCount: urls.length,
        photos: {
          create: urls.map((url, i) => ({ url, uploaderId: userId, position: i })),
        },
      },
      include: { photos: { orderBy: { position: 'asc' } } },
    });
    return NextResponse.json({ data: album }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create album', detail: String(err) }, { status: 500 });
  }
}
