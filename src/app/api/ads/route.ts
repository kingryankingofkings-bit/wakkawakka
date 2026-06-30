import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/ads - Lists advertiser's campaigns
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const campaigns = await prisma.ad.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: campaigns });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch campaigns", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/ads - Creates an ad campaign
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      copy,
      imageUrl,
      targetUrl,
      budget,
      bidAmount,
      ageMin,
      ageMax,
      gender,
      location,
    } = body;

    if (!title || !copy || !targetUrl || budget == null || bidAmount == null) {
      return NextResponse.json(
        { error: "title, copy, targetUrl, budget and bidAmount are required" },
        { status: 400 },
      );
    }

    const campaign = await prisma.ad.create({
      data: {
        creatorId: userId,
        title,
        copy,
        imageUrl,
        targetUrl,
        budget: parseFloat(budget),
        bidAmount: parseFloat(bidAmount),
        ageMin: ageMin ? parseInt(ageMin) : null,
        ageMax: ageMax ? parseInt(ageMax) : null,
        gender: gender || null,
        location: location || null,
        isActive: true,
      },
    });

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create campaign", detail: String(err) },
      { status: 500 },
    );
  }
}
