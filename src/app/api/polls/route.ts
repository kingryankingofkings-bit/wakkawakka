import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// POST /api/polls — create a poll attached to a (new or existing) post
// body: { postId?, question, options: string[], allowMultiple?, expiresAt?, content? }
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await req.json();
    const { question, options, allowMultiple, expiresAt, content } = body;
    let { postId } = body;

    if (
      !question ||
      !Array.isArray(options) ||
      options.filter((o: string) => o?.trim()).length < 2
    ) {
      return NextResponse.json(
        { error: "A question and at least 2 options are required" },
        { status: 400 },
      );
    }

    // create a host post if one wasn't supplied
    if (!postId) {
      const post = await prisma.post.create({
        data: { authorId: userId, content: content ?? question, type: "TEXT" },
      });
      postId = post.id;
    }

    const poll = await prisma.poll.create({
      data: {
        postId,
        creatorId: userId,
        question,
        allowMultiple: Boolean(allowMultiple),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        options: {
          create: options
            .filter((o: string) => o?.trim())
            .map((text: string, i: number) => ({
              text: text.trim(),
              position: i,
            })),
        },
      },
      include: { options: true },
    });
    return NextResponse.json({ data: poll }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create poll", detail: String(err) },
      { status: 500 },
    );
  }
}

// GET /api/polls?postId=xxx — fetch a poll with current results + user's votes
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId)
    return NextResponse.json({ error: "postId required" }, { status: 400 });

  try {
    const poll = await prisma.poll.findUnique({
      where: { postId },
      include: {
        options: { orderBy: { position: "asc" } },
        votes: {
          where: { userId: userId ?? "__none__" },
          select: { optionId: true },
        },
        _count: { select: { votes: true } },
      },
    });
    if (!poll) return NextResponse.json({ data: null });
    return NextResponse.json({ data: poll });
  } catch (err) {
    return NextResponse.json({ data: null, detail: String(err) });
  }
}
