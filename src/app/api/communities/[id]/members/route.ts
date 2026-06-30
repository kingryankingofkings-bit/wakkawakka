import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/communities/[id]/members - list members of community
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: params.id,
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
        joinedAt: "asc",
      },
    });

    return NextResponse.json({ data: members });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch members", detail: String(err) },
      { status: 500 },
    );
  }
}
