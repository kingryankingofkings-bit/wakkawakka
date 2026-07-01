import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

const VALID = ["GOING", "INTERESTED", "DECLINED"];

// POST /api/events/:id/rsvp  { status: 'GOING'|'INTERESTED'|'DECLINED' }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { status } = await req.json();
    if (!VALID.includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const prev = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: params.id, userId } },
    });

    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId: params.id, userId } },
      update: { status },
      create: { eventId: params.id, userId, status },
    });

    // recompute counts (cheap, keeps them accurate)
    const [going, interested] = await Promise.all([
      prisma.eventAttendee.count({
        where: { eventId: params.id, status: "GOING" },
      }),
      prisma.eventAttendee.count({
        where: { eventId: params.id, status: "INTERESTED" },
      }),
    ]);
    await prisma.event.update({
      where: { id: params.id },
      data: { goingCount: going, interestedCount: interested },
    });

    if (!prev && status === "GOING") {
      await notify({
        userId: event.creatorId,
        actorId: userId,
        type: "COMMENT",
        targetType: "POST",
        targetId: event.id,
        message: `is going to ${event.title}`,
        actionUrl: `/events`,
      });
    }

    return NextResponse.json({
      data: { status, goingCount: going, interestedCount: interested },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to RSVP", detail: String(err) },
      { status: 500 },
    );
  }
}
