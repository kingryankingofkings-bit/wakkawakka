import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/servers/[id]/boosts - Boost the server
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify membership
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this server" },
        { status: 403 },
      );
    }

    const boost = await prisma.serverBoost.create({
      data: {
        serverId,
        userId,
      },
    });

    return NextResponse.json({ data: boost, boost });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to boost server", detail: String(err) },
      { status: 500 },
    );
  }
}
