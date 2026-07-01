import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
        { status: 400 }
      );
    }

    // Mock history data
    const mockSubscriptions = [
      { id: "sub_1", plan: "Best Pro", status: "Active", price: "$20.00", date: "2026-06-01" },
    ];

    const mockInvoices = [
      { id: "inv_101", amount: "$20.00", date: "2026-06-01", status: "Paid", pdfUrl: "#" },
    ];

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: mockSubscriptions,
        invoices: mockInvoices,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
