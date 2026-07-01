import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;
  const userId = await getRequestUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { giftName, amount, quantity = 1 } = body;

    if (!giftName || !amount) {
      return NextResponse.json(
        { error: "giftName and amount are required" },
        { status: 400 },
      );
    }

    const numAmount = Number(amount);
    const numQuantity = Number(quantity);

    if (
      isNaN(numAmount) ||
      isNaN(numQuantity) ||
      numAmount <= 0 ||
      numQuantity <= 0
    ) {
      return NextResponse.json(
        { error: "amount and quantity must be positive numbers" },
        { status: 400 },
      );
    }

    const totalCost = numAmount * numQuantity;

    // Get sender and check balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { channelPoints: true, displayName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.channelPoints < totalCost) {
      return NextResponse.json(
        { error: "Insufficient channel points" },
        { status: 400 },
      );
    }

    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Execute transaction: deduct points, increment stream giftTotal, create gift log, create chat message
    const [updatedUser, _updatedStream, giftLog, chatMsg] =
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            channelPoints: {
              decrement: totalCost,
            },
          },
        }),
        prisma.liveStream.update({
          where: { id: streamId },
          data: {
            giftTotal: {
              increment: totalCost,
            },
          },
        }),
        prisma.liveStreamGift.create({
          data: {
            liveStreamId: streamId,
            senderId: userId,
            giftType: "POINTS",
            giftName,
            amount: numAmount,
            quantity: numQuantity,
          },
          include: {
            liveStream: {
              select: {
                title: true,
              },
            },
          },
        }),
        prisma.liveStreamChatMessage.create({
          data: {
            liveStreamId: streamId,
            userId: userId,
            message: `Sent ${quantity}x ${giftName}!`,
            type: "GIFT",
            giftAmount: totalCost,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.channelPoints,
      gift: {
        id: giftLog.id,
        giftName: giftLog.giftName,
        amount: giftLog.amount,
        quantity: giftLog.quantity,
        sender: {
          id: userId,
          displayName: updatedUser.displayName,
        },
        chatMessage: chatMsg,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
