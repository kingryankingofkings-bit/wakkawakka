import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const subreddit = await prisma.subreddit.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { name: id }],
      },
    });

    if (!subreddit) {
      return NextResponse.json({ error: "Subreddit not found" }, { status: 404 });
    }

    // Read optionally if client specifically wants to leave
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body may be empty, which is fine
    }
    const forceLeave = body?.leave === true;

    const existingMember = await prisma.subredditMember.findUnique({
      where: {
        subredditId_userId: {
          subredditId: subreddit.id,
          userId,
        },
      },
    });

    if (existingMember) {
      // User is already a member, so leave if forceLeave is true or toggling
      await prisma.$transaction(async (tx) => {
        await tx.subredditMember.delete({
          where: {
            subredditId_userId: {
              subredditId: subreddit.id,
              userId,
            },
          },
        });

        await tx.subreddit.update({
          where: { id: subreddit.id },
          data: {
            memberCount: {
              decrement: 1,
            },
          },
        });
      });

      return NextResponse.json({ joined: false, message: "Left subreddit successfully" });
    } else {
      // User is not a member, so join (unless user requested leave)
      if (forceLeave) {
        return NextResponse.json({ joined: false, message: "Not a member" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.subredditMember.create({
          data: {
            subredditId: subreddit.id,
            userId,
            role: "MEMBER",
          },
        });

        await tx.subreddit.update({
          where: { id: subreddit.id },
          data: {
            memberCount: {
              increment: 1,
            },
          },
        });
      });

      return NextResponse.json({ joined: true, message: "Joined subreddit successfully" });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to join/leave subreddit", detail: err.message },
      { status: 500 }
    );
  }
}
