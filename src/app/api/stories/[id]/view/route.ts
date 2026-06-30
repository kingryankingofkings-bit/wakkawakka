import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: storyId } = params;
    const activeUserId = getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const view = await prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId: activeUserId,
        },
      },
      create: {
        storyId,
        viewerId: activeUserId,
      },
      update: {},
    });

    return NextResponse.json({ data: view });
  } catch (error) {
    console.error("Error viewing story:", error);
    return NextResponse.json(
      { error: "Failed to record story view" },
      { status: 500 },
    );
  }
}
