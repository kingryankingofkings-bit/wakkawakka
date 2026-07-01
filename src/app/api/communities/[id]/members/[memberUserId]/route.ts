import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// PATCH /api/communities/[id]/members/[memberUserId] - assign flair/role to community member
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberUserId: string } },
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

    // Verify creator/admin role of caller
    const actor = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });

    const isPrivileged =
      community.creatorId === userId ||
      (actor && ["ADMIN", "MODERATOR"].includes(actor.role));
    if (!isPrivileged)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { flair, role } = body;

    const member = await prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId: params.id,
          userId: params.memberUserId,
        },
      },
      data: {
        flair: flair !== undefined ? flair : undefined,
        role: role !== undefined ? role : undefined,
      },
    });

    return NextResponse.json({ data: member });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update member", detail: String(err) },
      { status: 500 },
    );
  }
}
