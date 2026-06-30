import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/profile - Fetch professional profile data
export async function GET(req: NextRequest) {
  const actingUserId = getRequestUserId(req);
  const targetUserId = req.nextUrl.searchParams.get("userId") || actingUserId;

  if (!targetUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        headline: true,
        workHistory: true,
        education: true,
        skills: true,
        isPremium: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safely parse JSON strings
    let workHistory = [];
    let education = [];
    let skills = [];

    try {
      workHistory = JSON.parse(user.workHistory || "[]");
    } catch (_) {}
    try {
      education = JSON.parse(user.education || "[]");
    } catch (_) {}
    try {
      skills = JSON.parse(user.skills || "[]");
    } catch (_) {}

    return NextResponse.json({
      data: {
        ...user,
        workHistory,
        education,
        skills,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch profile", detail: String(err) },
      { status: 500 }
    );
  }
}

// PUT /api/professional/profile - Update professional profile data
export async function PUT(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { headline, workHistory, education, skills } = body;

    const updateData: any = {};
    if (headline !== undefined) updateData.headline = headline;
    if (workHistory !== undefined) {
      updateData.workHistory = typeof workHistory === "string" ? workHistory : JSON.stringify(workHistory);
    }
    if (education !== undefined) {
      updateData.education = typeof education === "string" ? education : JSON.stringify(education);
    }
    if (skills !== undefined) {
      updateData.skills = typeof skills === "string" ? skills : JSON.stringify(skills);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        headline: true,
        workHistory: true,
        education: true,
        skills: true,
        isPremium: true,
      },
    });

    // Safely parse back for the response
    let parsedWorkHistory = [];
    let parsedEducation = [];
    let parsedSkills = [];

    try {
      parsedWorkHistory = JSON.parse(updatedUser.workHistory || "[]");
    } catch (_) {}
    try {
      parsedEducation = JSON.parse(updatedUser.education || "[]");
    } catch (_) {}
    try {
      parsedSkills = JSON.parse(updatedUser.skills || "[]");
    } catch (_) {}

    return NextResponse.json({
      data: {
        ...updatedUser,
        workHistory: parsedWorkHistory,
        education: parsedEducation,
        skills: parsedSkills,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update profile", detail: String(err) },
      { status: 500 }
    );
  }
}
