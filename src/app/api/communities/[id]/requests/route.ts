import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/communities/[id]/requests - fetch pending join requests for creator/admin of the community
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({
      where: { id: params.id },
    });
    if (!community)
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );

    // Verify creator/admin role
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });

    const isPrivileged =
      community.creatorId === userId ||
      (member && ["ADMIN", "MODERATOR"].includes(member.role));
    if (!isPrivileged)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const requests = await prisma.communityJoinRequest.findMany({
      where: {
        communityId: params.id,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
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
      { error: "Failed to fetch join requests", detail: String(err) },
      { status: 500 },
    );
  }
}
