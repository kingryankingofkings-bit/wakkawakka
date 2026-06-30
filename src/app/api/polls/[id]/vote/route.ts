import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// POST /api/polls/:id/vote  { optionId } — cast (or change) a vote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { optionId } = await req.json();
    if (!optionId)
      return NextResponse.json({ error: "optionId required" }, { status: 400 });

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: { options: true },
    });
    if (!poll)
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (poll.isClosed || (poll.expiresAt && poll.expiresAt < new Date())) {
      return NextResponse.json({ error: "Poll is closed" }, { status: 409 });
    }
    if (!poll.options.some((o: any) => o.id === optionId)) {
      return NextResponse.json(
        { error: "Option does not belong to this poll" },
        { status: 400 },
      );
    }

    if (!poll.allowMultiple) {
      // single-choice: clear any previous votes by this user on this poll
      await prisma.pollVote.deleteMany({ where: { pollId: poll.id, userId } });
    }

    await prisma.pollVote.upsert({
      where: { optionId_userId: { optionId, userId } },
      update: {},
      create: { pollId: poll.id, optionId, userId },
    });

    // recompute option tallies
    const tallies = await prisma.pollVote.groupBy({
      by: ["optionId"],
      where: { pollId: poll.id },
      _count: { optionId: true },
    });
    await Promise.all(
      poll.options.map((o: any) => {
        const t = tallies.find((x: any) => x.optionId === o.id);
        return prisma.pollOption.update({
          where: { id: o.id },
          data: { votesCount: t?._count.optionId ?? 0 },
        });
      }),
    );

    const updated = await prisma.poll.findUnique({
      where: { id: poll.id },
      include: {
        options: { orderBy: { position: "asc" } },
        votes: { where: { userId }, select: { optionId: true } },
        _count: { select: { votes: true } },
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to vote", detail: String(err) },
      { status: 500 },
    );
  }
}
