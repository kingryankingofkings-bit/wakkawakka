import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Find existing streak
    let streak = await prisma.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Create if it does not exist
      streak = await prisma.streak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          totalDaysActive: 1,
          lastActivityAt: now,
        },
      });
      return NextResponse.json({ data: streak });
    }

    const lastActivity = new Date(streak.lastActivityAt);
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let updatedStreak;
    if (diffHours < 24) {
      // If < 24 hours: do nothing, update lastActivityAt
      updatedStreak = await prisma.streak.update({
        where: { userId },
        data: {
          lastActivityAt: now,
        },
      });
    } else if (diffHours >= 24 && diffHours <= 48) {
      // If between 24 and 48 hours: increment currentStreak, update longestStreak if needed, increment totalDaysActive
      const newCurrent = streak.currentStreak + 1;
      const newLongest = Math.max(streak.longestStreak, newCurrent);
      updatedStreak = await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          totalDaysActive: streak.totalDaysActive + 1,
          lastActivityAt: now,
        },
      });
    } else {
      // If > 48 hours: reset currentStreak to 1, increment totalDaysActive
      updatedStreak = await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          totalDaysActive: streak.totalDaysActive + 1,
          lastActivityAt: now,
        },
      });
    }

    return NextResponse.json({ data: updatedStreak });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to log activity", detail: String(err) },
      { status: 500 },
    );
  }
}
