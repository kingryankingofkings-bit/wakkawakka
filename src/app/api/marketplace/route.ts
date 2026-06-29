import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

const sellerSelect = { id: true, username: true, displayName: true, avatar: true, isVerified: true, location: true };

// GET /api/marketplace?category=&q=&min=&max=&condition=&sort=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get('category');
  const q = sp.get('q');
  const condition = sp.get('condition');
  const min = sp.get('min');
  const max = sp.get('max');
  const sort = sp.get('sort') ?? 'recent';

  try {
    const where: Record<string, unknown> = { isActive: true, isDeleted: false };
    if (category && category !== 'all') where.category = category;
    if (condition) where.condition = condition;
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
    if (min || max) {
      where.price = {};
      if (min) (where.price as Record<string, number>).gte = parseFloat(min);
      if (max) (where.price as Record<string, number>).lte = parseFloat(max);
    }

    const orderBy =
      sort === 'price_low' ? { price: 'asc' as const }
      : sort === 'price_high' ? { price: 'desc' as const }
      : { createdAt: 'desc' as const };

    const listings = await prisma.product.findMany({
      where,
      include: { seller: { select: sellerSelect } },
      orderBy,
      take: 60,
    });
    return NextResponse.json({ data: listings, meta: { total: listings.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}

// POST /api/marketplace — create a listing
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, description, price, category, condition, images, shippingInfo, stockCount } = await req.json();
    if (!name || price == null || !category) {
      return NextResponse.json({ error: 'name, price and category are required' }, { status: 400 });
    }

    const listing = await prisma.product.create({
      data: {
        sellerId: userId,
        name,
        description,
        price: parseFloat(price),
        category,
        condition: condition ?? 'USED',
        images: JSON.stringify(Array.isArray(images) ? images : []),
        shippingInfo,
        stockCount: stockCount != null ? parseInt(stockCount) : null,
      },
      include: { seller: { select: sellerSelect } },
    });
    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create listing', detail: String(err) }, { status: 500 });
  }
}
