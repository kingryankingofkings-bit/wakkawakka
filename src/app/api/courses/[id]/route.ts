import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/courses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const course = await prisma.learningCourse.findUnique({
      where: { id },
      include: {
        enrollments: {
          select: {
            userId: true,
            progressPercentage: true,
            status: true,
            completed: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ data: course });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

const ratingSchema = z.object({
  rating: z.number().min(0).max(10),
});

// POST /api/courses/[id]/rate  — handled via this route with ?action=rate
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "rate") {
      const parsed = ratingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Rating must be 0–10" }, { status: 400 });
      }
      const newRating = parsed.data.rating;

      // Check enrollment
      const enrollment = await prisma.learningEnrollment.findUnique({
        where: { courseId_userId: { courseId: id, userId } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "You must be enrolled to rate this course" }, { status: 403 });
      }

      const course = await prisma.learningCourse.findUnique({ where: { id } }) as any;
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      // Recalculate rolling average
      const currentTotal = (course.rating ?? 0) * (course.ratingCount ?? 0);
      const newCount = (course.ratingCount ?? 0) + 1;
      const newAverage = (currentTotal + newRating) / newCount;

      const updated = await (prisma.learningCourse.update as any)({
        where: { id },
        data: {
          rating: parseFloat(newAverage.toFixed(2)),
          ratingCount: newCount,
        },
      });

      return NextResponse.json({ data: updated });
    }

    if (action === "progress") {
      const { progressPercentage } = body as { progressPercentage: number };
      if (typeof progressPercentage !== "number") {
        return NextResponse.json({ error: "progressPercentage required" }, { status: 400 });
      }

      const enrollment = await prisma.learningEnrollment.findUnique({
        where: { courseId_userId: { courseId: id, userId } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
      }

      const completed = progressPercentage >= 100;
      const updated = await prisma.learningEnrollment.update({
        where: { courseId_userId: { courseId: id, userId } },
        data: {
          progressPercentage,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Course PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
