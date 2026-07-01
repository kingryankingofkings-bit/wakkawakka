import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: postId } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, price, icon } = body;

    if (!name || price === undefined || !icon) {
      return NextResponse.json({ error: "Award name, price, and icon are required" }, { status: 400 });
    }

    if (typeof price !== "number" || price <= 0 || !Number.isInteger(price)) {
      return NextResponse.json({ error: "Price must be a positive integer" }, { status: 400 });
    }

    const post = await prisma.subredditPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Sender and receiver must be different users (optional, but let's allow it unless prohibited)
    const sender = await prisma.user.findUnique({ where: { id: userId } });
    if (!sender) {
      return NextResponse.json({ error: "Sender user not found" }, { status: 404 });
    }

    if (sender.channelPoints < price) {
      return NextResponse.json({ error: "Insufficient channel points balance" }, { status: 400 });
    }

    // Atomic transaction
    const award = await prisma.$transaction(async (tx) => {
      // 1. Deduct points from sender
      await tx.user.update({
        where: { id: userId },
        data: {
          channelPoints: {
            decrement: price,
          },
        },
      });

      // 2. Add karma to receiver (receiver gets a flat bonus, or price as karma)
      // Let's increment by a portion or the full price as karma. Let's do a proportional amount, e.g. price / 10 (min 1)
      const karmaBonus = Math.max(1, Math.floor(price / 10));
      await tx.user.update({
        where: { id: post.authorId },
        data: {
          redditKarma: {
            increment: karmaBonus,
          },
        },
      });

      // 3. Create RedditAward record
      const aw = await tx.redditAward.create({
        data: {
          name,
          icon,
          price,
          senderId: userId,
          receiverId: post.authorId,
          targetId: postId,
          targetType: "POST",
        },
      });

      return aw;
    });

    return NextResponse.json({ data: award });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to give award to post", detail: err.message },
      { status: 500 }
    );
  }
}
