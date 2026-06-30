import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { event } = body;

    if (event !== 'impression' && event !== 'click') {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad campaign not found' }, { status: 404 });
    }

    // Charge bidAmount to spent for clicks, increment impression count for impressions
    let updateData: any = {};
    if (event === 'click') {
      updateData = {
        clicks: { increment: 1 },
        spent: { increment: ad.bidAmount },
      };
    } else {
      updateData = {
        impressions: { increment: 1 },
      };
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: updateData,
    });

    // Pause campaign if out of budget
    if (updatedAd.spent >= updatedAd.budget) {
      await prisma.ad.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true, spent: updatedAd.spent, isActive: updatedAd.isActive });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to track ad event', detail: String(err) }, { status: 500 });
  }
}
