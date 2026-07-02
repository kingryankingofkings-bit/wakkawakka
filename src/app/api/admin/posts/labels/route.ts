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
    const user = await prisma.profile.findUnique({ where: { id: userId } });
    // In our prototype, all users can manage this or we can check isAdmin
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { postId, labels } = body;

    if (!postId || !labels) {
      return NextResponse.json(
        { error: "postId and labels are required" },
        { status: 400 },
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        labels: Array.isArray(labels) ? JSON.stringify(labels) : String(labels),
      },
    });

    return NextResponse.json({ data: updatedPost });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update post labels", detail: String(err) },
      { status: 500 },
    );
  }
}
