import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const senderId = await getRequestUserId(req);
  if (!senderId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { receiverId, mediaUrl, type } = await req.json();
    if (!receiverId || !mediaUrl) {
      return NextResponse.json(
        { error: "receiverId and mediaUrl are required" },
        { status: 400 },
      );
    }

    const disappearingMedia = await prisma.disappearingMedia.create({
      data: {
        senderId,
        receiverId,
        mediaUrl,
        type: type || "IMAGE",
        isViewed: false,
      },
    });

    return NextResponse.json({ data: disappearingMedia }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create disappearing media", detail: String(err) },
      { status: 500 },
    );
  }
}
