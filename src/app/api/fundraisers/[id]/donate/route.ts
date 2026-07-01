import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount } = body;

    if (amount == null || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Please specify a positive donation amount" },
        { status: 400 },
      );
    }

    const donationAmount = parseFloat(amount);

    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id },
    });

    if (!fundraiser) {
      return NextResponse.json(
        { error: "Fundraiser not found" },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Donation Record
      const donation = await tx.fundraiserDonation.create({
        data: {
          fundraiserId: id,
          donorId: userId,
          amount: donationAmount,
        },
      });

      // 2. Increment Raised Amount
      const updatedFundraiser = await tx.fundraiser.update({
        where: { id },
        data: {
          raisedAmount: { increment: donationAmount },
        },
      });

      // 3. Mark completed if goal reached
      if (updatedFundraiser.raisedAmount >= updatedFundraiser.goalAmount) {
        await tx.fundraiser.update({
          where: { id },
          data: { status: "COMPLETED" },
        });
      }

      return updatedFundraiser;
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: "Donation failed to process", detail: String(err) },
      { status: 500 },
    );
  }
}
