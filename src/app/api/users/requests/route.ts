import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/users/requests - fetch incoming pending follow requests for the acting user
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const requests = await prisma.follow.findMany({
      where: {
        followingId: userId,
        status: "PENDING",
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            isVerified: true,
            verificationTier: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: requests });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch follow requests", detail: String(err) },
      { status: 500 },
    );
  }
}
