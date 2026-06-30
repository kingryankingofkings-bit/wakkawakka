import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/developer/webhooks - Get subscriptions and delivery logs
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: { userId },
      include: {
        deliveryLogs: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: subscriptions });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch webhook subscriptions", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/developer/webhooks - Register a new webhook
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, events } = body;

    if (!url || !events) {
      return NextResponse.json(
        { error: "url and events are required" },
        { status: 400 },
      );
    }

    // Generate a secure signing secret
    const randomHex = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const secret = `whsec_${randomHex}`;

    const subscription = await prisma.webhookSubscription.create({
      data: {
        userId,
        url,
        events: Array.isArray(events) ? events.join(",") : String(events),
        secret,
        isActive: true,
      },
    });

    return NextResponse.json({ data: subscription }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to register webhook", detail: String(err) },
      { status: 500 },
    );
  }
}

// PUT /api/developer/webhooks - Toggle webhook active status
export async function PUT(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, isActive } = body;

    if (!id || isActive === undefined) {
      return NextResponse.json(
        { error: "id and isActive are required" },
        { status: 400 },
      );
    }

    const sub = await prisma.webhookSubscription.findFirst({
      where: { id, userId },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const updatedSub = await prisma.webhookSubscription.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ data: updatedSub });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update subscription", detail: String(err) },
      { status: 500 },
    );
  }
}
