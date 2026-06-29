import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

const ownerSelect = { id: true, username: true, displayName: true, avatar: true, isVerified: true };

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || `page-${Date.now()}`;
}

// GET /api/pages?filter=all|mine|following&category=
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  const filter = req.nextUrl.searchParams.get('filter') ?? 'all';
  const category = req.nextUrl.searchParams.get('category');

  try {
    let where: any = {};
    if (category) where.category = category;
    if (filter === 'mine' && userId) where = { ...where, ownerId: userId };
    if (filter === 'following' && userId) where = { ...where, followers: { some: { userId } } };

    const pages = await prisma.page.findMany({
      where,
      include: {
        owner: { select: ownerSelect },
        followers: { where: { userId: userId ?? '__none__' }, select: { id: true } },
        _count: { select: { followers: true } },
      },
      orderBy: { followerCount: 'desc' },
      take: 50,
    });
    return NextResponse.json({ data: pages, meta: { total: pages.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}

// POST /api/pages — create a page
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, category, description, website, avatarUrl, coverImage } = await req.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    let slug = slugify(name);
    if (await prisma.page.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

    const page = await prisma.page.create({
      data: {
        ownerId: userId,
        name,
        slug,
        category: category ?? 'GENERAL',
        description,
        website,
        avatarUrl,
        coverImage,
        roles: { create: { userId, role: 'ADMIN' } },
      },
      include: { owner: { select: ownerSelect } },
    });
    return NextResponse.json({ data: page }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create page', detail: String(err) }, { status: 500 });
  }
}
