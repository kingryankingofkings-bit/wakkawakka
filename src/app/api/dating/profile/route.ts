import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let profile = await prisma.datingProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.datingProfile.create({
        data: {
          userId,
          bio: "Looking for connection",
          prompts: JSON.stringify([
            {
              question: "My perfect Sunday is...",
              answer: "Coding and playing games.",
            },
            {
              question: "First date idea:",
              answer: "Grab boba and walk in the park.",
            },
          ]),
          lookingFor: "ANY",
          matches: JSON.stringify([]),
          crushes: JSON.stringify([]),
          datingEvents: JSON.stringify([]),
        },
      });
    }

    return NextResponse.json({ data: profile });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch dating profile", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bio, prompts, lookingFor, crushes } = body;

    const profile = await prisma.datingProfile.upsert({
      where: { userId },
      update: {
        bio: bio ?? undefined,
        prompts: prompts
          ? Array.isArray(prompts)
            ? JSON.stringify(prompts)
            : String(prompts)
          : undefined,
        lookingFor: lookingFor ?? undefined,
        crushes: crushes
          ? Array.isArray(crushes)
            ? JSON.stringify(crushes)
            : String(crushes)
          : undefined,
      },
      create: {
        userId,
        bio: bio || "",
        prompts: prompts
          ? Array.isArray(prompts)
            ? JSON.stringify(prompts)
            : String(prompts)
          : JSON.stringify([]),
        lookingFor: lookingFor || "ANY",
        crushes: crushes
          ? Array.isArray(crushes)
            ? JSON.stringify(crushes)
            : String(crushes)
          : JSON.stringify([]),
      },
    });

    return NextResponse.json({ data: profile });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update dating profile", detail: String(err) },
      { status: 500 },
    );
  }
}
