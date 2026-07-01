import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/learning - Retrieve courses and user enrollments
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  const category = req.nextUrl.searchParams.get("category");

  try {
    const whereClause: any = {};
    if (category) {
      whereClause.category = category;
    }

    const courses = await prisma.learningCourse.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    let enrollments: any[] = [];
    if (userId) {
      enrollments = await prisma.learningEnrollment.findMany({
        where: { userId },
        include: {
          course: true,
        },
      });
    }

    // Support both direct return and wrapped in data for maximum compatibility
    const responsePayload = {
      courses,
      enrollments,
      data: {
        courses,
        enrollments,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch learning catalog", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/learning - Enroll in a learning course
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Check if course exists
    const course = await prisma.learningCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await prisma.learningEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ data: existing });
    }

    const enrollment = await prisma.learningEnrollment.create({
      data: {
        courseId,
        userId,
        progressPercentage: 0.0,
        status: "ENROLLED",
        completed: false,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({ data: enrollment });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to enroll in course", detail: String(err) },
      { status: 500 }
    );
  }
}
