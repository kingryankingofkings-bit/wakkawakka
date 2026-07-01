import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// POST /api/pages/:id/follow — toggle follow on a page
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const existing = await prisma.pageFollower.findUnique({
      where: { pageId_userId: { pageId: params.id, userId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.pageFollower.delete({ where: { id: existing.id } }),
        prisma.page.update({
          where: { id: params.id },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ data: { following: false } });
    }

    await prisma.$transaction([
      prisma.pageFollower.create({ data: { pageId: params.id, userId } }),
      prisma.page.update({
        where: { id: params.id },
        data: { followerCount: { increment: 1 } },
      }),
    ]);
    return NextResponse.json({ data: { following: true } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to toggle follow", detail: String(err) },
      { status: 500 },
    );
  }
}
