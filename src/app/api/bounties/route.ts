import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const bounties = await prisma.bounty.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: bounties });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch bounties", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, rewardAmount } = body;

    if (!title || rewardAmount == null) {
      return NextResponse.json(
        { error: "title and rewardAmount are required" },
        { status: 400 },
      );
    }

    const bounty = await prisma.bounty.create({
      data: {
        creatorId: userId,
        title,
        description,
        rewardAmount: parseFloat(rewardAmount),
        status: "ACTIVE",
        participantsCount: 0,
      },
    });

    return NextResponse.json({ data: bounty }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create bounty", detail: String(err) },
      { status: 500 },
    );
  }
}
