import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;

  try {
    const media = await prisma.disappearingMedia.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.senderId !== userId && media.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (media.isViewed) {
      return NextResponse.json({ error: "Gone" }, { status: 410 });
    }

    // Mark as viewed
    const updatedMedia = await prisma.disappearingMedia.update({
      where: { id },
      data: {
        isViewed: true,
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ data: updatedMedia });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to retrieve disappearing media", detail: String(err) },
      { status: 500 },
    );
  }
}
