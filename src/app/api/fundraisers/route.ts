import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const fundraisers = await prisma.fundraiser.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: fundraisers });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch fundraisers", detail: String(err) },
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
    const { title, description, goalAmount } = body;

    if (!title || goalAmount == null) {
      return NextResponse.json(
        { error: "title and goalAmount are required" },
        { status: 400 },
      );
    }

    const fundraiser = await prisma.fundraiser.create({
      data: {
        creatorId: userId,
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        raisedAmount: 0,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ data: fundraiser }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create fundraiser", detail: String(err) },
      { status: 500 },
    );
  }
}
