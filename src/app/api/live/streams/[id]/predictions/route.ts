import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/live/streams/[id]/predictions - Fetch the active/locked prediction for a stream
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;

  try {
    const prediction = await prisma.prediction.findFirst({
      where: {
        liveStreamId: streamId,
        status: { in: ["ACTIVE", "LOCKED"] },
      },
      include: {
        options: true,
        bets: {
          select: {
            id: true,
            userId: true,
            optionId: true,
            points: true,
          },
        },
      },
    });

    return NextResponse.json({ prediction: prediction || null });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/live/streams/[id]/predictions - Unified prediction actions (CREATE, BET, LOCK, RESOLVE, CANCEL)
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;
  const userId = getRequestUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body; // CREATE | BET | LOCK | RESOLVE | CANCEL

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    // 1. CREATE PREDICTION (Host Only)
    if (action === "CREATE") {
      if (stream.hostId !== userId) {
        return NextResponse.json(
          { error: "Only the host can create predictions" },
          { status: 403 },
        );
      }

      const { title, options } = body;
      if (!title || !options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: "Title and at least 2 options are required" },
          { status: 400 },
        );
      }

      // Check if there is already an active/locked prediction
      const existingActive = await prisma.prediction.findFirst({
        where: {
          liveStreamId: streamId,
          status: { in: ["ACTIVE", "LOCKED"] },
        },
      });

      if (existingActive) {
        return NextResponse.json(
          { error: "There is already an active prediction running" },
          { status: 400 },
        );
      }

      const newPrediction = await prisma.prediction.create({
        data: {
          liveStreamId: streamId,
          title,
          status: "ACTIVE",
          options: {
            create: options.map((opt: string) => ({
              text: opt,
              totalPoints: 0,
            })),
          },
        },
        include: {
          options: true,
        },
      });

      return NextResponse.json({
        prediction: newPrediction,
        message: "Prediction created",
      });
    }

    // 2. PLACE BET (User Only)
    if (action === "BET") {
      const { optionId, points } = body;

      if (
        typeof points !== "number" ||
        Array.isArray(points) ||
        points === null ||
        typeof points === "object" ||
        isNaN(points) ||
        points <= 0 ||
        !Number.isInteger(points)
      ) {
        return NextResponse.json(
          { error: "Points must be a valid positive integer number" },
          { status: 400 },
        );
      }

      if (!optionId) {
        return NextResponse.json(
          { error: "Invalid optionId" },
          { status: 400 },
        );
      }

      const pointsToBet = points;

      // Find active prediction
      const prediction = await prisma.prediction.findFirst({
        where: {
          liveStreamId: streamId,
          status: "ACTIVE",
        },
        include: {
          options: true,
        },
      });

      if (!prediction) {
        return NextResponse.json(
          { error: "No active prediction taking bets" },
          { status: 400 },
        );
      }

      const optionExists = prediction.options.some((o) => o.id === optionId);
      if (!optionExists) {
        return NextResponse.json(
          { error: "Option not found in this prediction" },
          { status: 404 },
        );
      }

      // Check user points balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { channelPoints: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.channelPoints < pointsToBet) {
        return NextResponse.json(
          { error: "Insufficient channel points" },
          { status: 400 },
        );
      }

      // Check if user already placed a bet on this prediction
      const existingBet = await prisma.predictionBet.findUnique({
        where: {
          predictionId_userId: {
            predictionId: prediction.id,
            userId,
          },
        },
      });

      if (existingBet) {
        return NextResponse.json(
          { error: "You have already placed a bet on this prediction" },
          { status: 400 },
        );
      }

      // Transaction: deduct user points, increment option points, create bet record
      try {
        const [updatedUser, updatedOption, bet] = await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { channelPoints: { decrement: pointsToBet } },
          }),
          prisma.predictionOption.update({
            where: { id: optionId },
            data: { totalPoints: { increment: pointsToBet } },
          }),
          prisma.predictionBet.create({
            data: {
              predictionId: prediction.id,
              optionId,
              userId,
              points: pointsToBet,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          newBalance: updatedUser.channelPoints,
          bet,
          message: "Bet placed successfully",
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          return NextResponse.json(
            { error: "You have already placed a bet on this prediction" },
            { status: 400 },
          );
        }
        throw err;
      }
    }

    // 3. LOCK PREDICTION (Host Only)
    if (action === "LOCK") {
      if (stream.hostId !== userId) {
        return NextResponse.json(
          { error: "Only the host can lock predictions" },
          { status: 403 },
        );
      }

      const activePred = await prisma.prediction.findFirst({
        where: {
          liveStreamId: streamId,
          status: "ACTIVE",
        },
      });

      if (!activePred) {
        return NextResponse.json(
          { error: "No active prediction found to lock" },
          { status: 400 },
        );
      }

      const lockedPred = await prisma.prediction.update({
        where: { id: activePred.id },
        data: { status: "LOCKED" },
        include: { options: true },
      });

      return NextResponse.json({
        prediction: lockedPred,
        message: "Prediction locked",
      });
    }

    // 4. RESOLVE PREDICTION (Host Only)
    if (action === "RESOLVE") {
      if (stream.hostId !== userId) {
        return NextResponse.json(
          { error: "Only the host can resolve predictions" },
          { status: 403 },
        );
      }

      const { winningOptionId } = body;
      if (!winningOptionId) {
        return NextResponse.json(
          { error: "winningOptionId is required to resolve" },
          { status: 400 },
        );
      }

      // Find active or locked prediction
      const prediction = await prisma.prediction.findFirst({
        where: {
          liveStreamId: streamId,
          status: { in: ["ACTIVE", "LOCKED"] },
        },
        include: {
          options: true,
          bets: true,
        },
      });

      if (!prediction) {
        return NextResponse.json(
          { error: "No active or locked prediction found to resolve" },
          { status: 400 },
        );
      }

      const winningOption = prediction.options.find(
        (o) => o.id === winningOptionId,
      );
      if (!winningOption) {
        return NextResponse.json(
          { error: "Winning option not found in this prediction" },
          { status: 400 },
        );
      }

      // Calculate total points
      const winningBets = prediction.bets.filter(
        (b) => b.optionId === winningOptionId,
      );
      const losingBets = prediction.bets.filter(
        (b) => b.optionId !== winningOptionId,
      );

      const W = winningBets.reduce((sum, b) => sum + b.points, 0);
      const L = losingBets.reduce((sum, b) => sum + b.points, 0);

      // Distribute payouts and update status in single transaction
      let resolvedPrediction;
      if (W > 0) {
        const payoutUpdates = winningBets.map((b) => {
          const payoutShare = Math.floor((b.points / W) * L);
          const totalPayout = b.points + payoutShare;

          return prisma.user.update({
            where: { id: b.userId },
            data: {
              channelPoints: {
                increment: totalPayout,
              },
            },
          });
        });

        const statusUpdate = prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            status: "RESOLVED",
            winningOptionId,
          },
          include: {
            options: true,
          },
        });

        const transactionResults = await prisma.$transaction([
          ...payoutUpdates,
          statusUpdate,
        ]);
        resolvedPrediction = transactionResults[transactionResults.length - 1];
      } else {
        // If there are no winning bets, refund all points to bettors
        const refundUpdates = prediction.bets.map((b) => {
          return prisma.user.update({
            where: { id: b.userId },
            data: {
              channelPoints: {
                increment: b.points,
              },
            },
          });
        });

        const statusUpdate = prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            status: "RESOLVED",
            winningOptionId,
          },
          include: {
            options: true,
          },
        });

        const transactionResults = await prisma.$transaction([
          ...refundUpdates,
          statusUpdate,
        ]);
        resolvedPrediction = transactionResults[transactionResults.length - 1];
      }

      // Get updated balance for host just to return it
      const hostUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { channelPoints: true },
      });

      return NextResponse.json({
        success: true,
        prediction: resolvedPrediction,
        newBalance: hostUser?.channelPoints ?? 0,
        message: "Prediction resolved and points distributed",
      });
    }

    // 5. CANCEL PREDICTION (Host Only)
    if (action === "CANCEL") {
      if (stream.hostId !== userId) {
        return NextResponse.json(
          { error: "Only the host can cancel predictions" },
          { status: 403 },
        );
      }

      const prediction = await prisma.prediction.findFirst({
        where: {
          liveStreamId: streamId,
          status: { in: ["ACTIVE", "LOCKED"] },
        },
        include: {
          bets: true,
        },
      });

      if (!prediction) {
        return NextResponse.json(
          { error: "No active or locked prediction found to cancel" },
          { status: 400 },
        );
      }

      // Refund everyone in a single transaction
      const refundUpdates = prediction.bets.map((b) => {
        return prisma.user.update({
          where: { id: b.userId },
          data: {
            channelPoints: {
              increment: b.points,
            },
          },
        });
      });

      const statusUpdate = prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          status: "CANCELLED",
        },
      });

      const transactionResults = await prisma.$transaction([
        ...refundUpdates,
        statusUpdate,
      ]);
      const cancelledPrediction =
        transactionResults[transactionResults.length - 1];

      // Get updated balance for host
      const hostUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { channelPoints: true },
      });

      return NextResponse.json({
        success: true,
        prediction: cancelledPrediction,
        newBalance: hostUser?.channelPoints ?? 0,
        message: "Prediction cancelled and points refunded",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
