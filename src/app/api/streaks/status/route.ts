import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const streak = await prisma.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      return NextResponse.json({
        data: {
          currentStreak: 0,
          longestStreak: 0,
          totalDaysActive: 0,
        },
      });
    }

    return NextResponse.json({ data: streak });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch streak status", detail: String(err) },
      { status: 500 },
    );
  }
}
