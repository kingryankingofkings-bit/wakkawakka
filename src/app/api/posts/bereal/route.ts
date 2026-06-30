import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mainImageUrl, btsImageUrl, visibility } = body;

    if (!mainImageUrl || !btsImageUrl) {
      return NextResponse.json(
        { error: "mainImageUrl and btsImageUrl are required" },
        { status: 400 },
      );
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        mediaUrls: JSON.stringify([mainImageUrl]),
        btsUrl: btsImageUrl,
        isEphemeral: true,
        expiresAt,
        type: "IMAGE",
        visibility: visibility || "PUBLIC",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    const data = {
      ...post,
      mediaUrls: [mainImageUrl],
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create BeReal post", detail: String(err) },
      { status: 500 },
    );
  }
}
