import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    const sub = await prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // 1. Construct simulated tipping event payload
    const payload = {
      event: 'tip.received',
      timestamp: new Date().toISOString(),
      data: {
        sender: 'wakkadev',
        amount: 25.00,
        message: 'Awesome work on Batch 5! Keep it up! 🚀',
      },
    };
    const payloadString = JSON.stringify(payload);

    // 2. Sign using HMAC-SHA256 with the secret
    const signature = crypto
      .createHmac('sha256', sub.secret)
      .update(payloadString)
      .digest('hex');

    // 3. Perform request to the subscriber's URL
    const startTime = Date.now();
    let statusCode: number | null = null;
    let responseBody = '';
    let success = false;

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wakka-Signature': signature,
        },
        body: payloadString,
        // Short timeout
        signal: AbortSignal.timeout(3000),
      });

      statusCode = res.status;
      responseBody = await res.text();
      success = res.ok;
    } catch (err: any) {
      responseBody = err.message || String(err);
      statusCode = null;
      success = false;
    }

    const durationMs = Date.now() - startTime;

    // 4. Log delivery results in WebhookDeliveryLog
    const log = await prisma.webhookDeliveryLog.create({
      data: {
        subscriptionId: sub.id,
        payload: payloadString,
        statusCode,
        responseBody: responseBody.substring(0, 1000), // Prevent DB bloat
        durationMs,
        success,
      },
    });

    return NextResponse.json({
      data: log,
      payload,
      signature,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to trigger test event', detail: String(err) }, { status: 500 });
  }
}
