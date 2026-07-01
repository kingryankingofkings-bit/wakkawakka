import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { targetUserId, action } = await req.json();
    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "targetUserId and action are required" },
        { status: 400 },
      );
    }

    if (action === "pass") {
      return NextResponse.json({ match: false });
    }

    // Fetch user's dating profile
    let myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
    });
    if (!myProfile) {
      myProfile = await prisma.datingProfile.create({
        data: { userId },
      });
    }

    // Fetch target's dating profile
    let targetProfile = await prisma.datingProfile.findUnique({
      where: { userId: targetUserId },
    });
    if (!targetProfile) {
      targetProfile = await prisma.datingProfile.create({
        data: { userId: targetUserId },
      });
    }

    // Parse lists
    const parseList = (str: string) => {
      try {
        return JSON.parse(str || "[]");
      } catch {
        return [];
      }
    };

    let myCrushes = parseList(myProfile.crushes);
    let myMatches = parseList(myProfile.matches);
    let targetCrushes = parseList(targetProfile.crushes);
    let targetMatches = parseList(targetProfile.matches);

    // Add target to my crushes if not already
    if (!myCrushes.includes(targetUserId)) {
      myCrushes.push(targetUserId);
    }

    let isMatch = false;
    // Check if target crushes me too
    if (targetCrushes.includes(userId)) {
      isMatch = true;
      if (!myMatches.includes(targetUserId)) myMatches.push(targetUserId);
      if (!targetMatches.includes(userId)) targetMatches.push(userId);
    }

    // Save profiles
    await prisma.datingProfile.update({
      where: { userId },
      data: {
        crushes: JSON.stringify(myCrushes),
        matches: JSON.stringify(myMatches),
      },
    });

    if (isMatch) {
      await prisma.datingProfile.update({
        where: { userId: targetUserId },
        data: {
          matches: JSON.stringify(targetMatches),
        },
      });
    }

    return NextResponse.json({
      match: isMatch,
      crushes: myCrushes,
      matches: myMatches,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process swipe", detail: String(err) },
      { status: 500 },
    );
  }
}
