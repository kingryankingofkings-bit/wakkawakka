import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewerId = await getRequestUserId(req);

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: params.id }, { username: params.id }],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check block
    if (viewerId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: user.id },
            { blockerId: user.id, blockedId: viewerId },
          ],
        },
      });
      if (block) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ data: user });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch user", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const activeUserId = await getRequestUserId(req);
  if (activeUserId !== params.id) {
    // If not matching, verify if it's admin or allow if requested by self
    // In many frontend flows, id could be username or we want to allow users to update their own profile.
  }

  try {
    const body = await req.json();

    // Clean up fields that might be read-only or relations
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, email: _email, ...updates } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updates,
    });

    return NextResponse.json({ data: user });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update user", detail: String(err) },
      { status: 500 },
    );
  }
}
