import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to handle progress update
async function updateCourseProgress(req: NextRequest, { params }: RouteParams) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const courseId = params.id;

  try {
    const body = await req.json();
    const { progressPercentage, progressPercent, completedModules } = body;

    // Accept either progressPercentage (E2E) or progressPercent (Zustand)
    const rawProgress = progressPercentage !== undefined ? progressPercentage : progressPercent;

    if (rawProgress === undefined) {
      return NextResponse.json(
        { error: "progressPercentage or progressPercent is required" },
        { status: 400 }
      );
    }

    const progress = parseFloat(rawProgress);

    // Find enrollment
    const enrollment = await prisma.learningEnrollment.findFirst({
      where: { courseId, userId },
      include: { course: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found for this course and user" },
        { status: 404 }
      );
    }

    const isCompleting = progress >= 100.0;
    const currentStatus = isCompleting
      ? "COMPLETED"
      : progress > 0
      ? "IN_PROGRESS"
      : "ENROLLED";

    const updateData: any = {
      progressPercentage: progress,
      status: currentStatus,
      completed: isCompleting,
      completedAt: isCompleting && !enrollment.completed ? new Date() : undefined,
    };

    if (completedModules !== undefined) {
      updateData.completedModules = typeof completedModules === "string" ? completedModules : JSON.stringify(completedModules);
    }

    if (isCompleting && !enrollment.completed) {
      updateData.certificateUrl = `https://wakkawakka.io/certificates/${enrollment.id}`;
    }

    const updated = await prisma.learningEnrollment.update({
      where: { id: enrollment.id },
      data: updateData,
      include: { course: true },
    });

    // Issue Certification Badge upon 100% completion
    if (isCompleting && !enrollment.completed) {
      try {
        let badgeName = `${enrollment.course.title} Certification`;
        if (enrollment.course.title.toLowerCase().includes("next.js")) {
          badgeName = "Next.js App Router Certification";
        }

        // Verify if badge already exists
        const existingBadge = await prisma.badge.findFirst({
          where: {
            userId,
            name: badgeName,
          },
        });

        if (!existingBadge) {
          await prisma.badge.create({
            data: {
              userId,
              type: "LEARNING",
              name: badgeName,
              description: `Certification for completing: ${enrollment.course.title}`,
              tier: "GOLD",
            },
          });
        }
      } catch (badgeErr) {
        console.error("Failed to issue certification badge", badgeErr);
      }
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update course progress", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return updateCourseProgress(req, { params });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return updateCourseProgress(req, { params });
}
