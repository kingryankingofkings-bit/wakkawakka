import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tier } = await req.json();

    if (!tier) {
      return NextResponse.json(
        { success: false, message: "Missing tier" },
        { status: 400 }
      );
    }

    // Mock successful payment processing
    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${tier}`,
      data: {
        subscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`,
        tier,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Payment processing failed" },
      { status: 500 }
    );
  }
}
