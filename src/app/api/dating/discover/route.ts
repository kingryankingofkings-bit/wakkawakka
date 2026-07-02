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
    // Get my matched and crushed IDs to exclude them from discover
    const myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
    });

    let excludeIds = [userId];
    if (myProfile) {
      try {
        const matches = JSON.parse(myProfile.matches || "[]");
        excludeIds = [...excludeIds, ...matches];
      } catch {}
    }

    // Find other users
    const discoverableUsers = await prisma.profile.findMany({
      where: {
        id: { notIn: excludeIds },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
      },
      take: 20,
    });

    return NextResponse.json({ data: discoverableUsers });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch discoverable users", detail: String(err) },
      { status: 500 },
    );
  }
}
