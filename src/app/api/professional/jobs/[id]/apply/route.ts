import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/professional/jobs/[id]/apply - Submit a job application
export async function POST(req: NextRequest, { params }: RouteParams) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const jobId = params.id;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check for duplicate application
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already applied for this job listing" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { resumeUrl, coverLetter } = body;

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantId: userId,
        resumeUrl,
        coverLetter,
        status: "PENDING",
      },
    });

    // Create a notification for the job poster
    try {
      const applicant = await prisma.profile.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true },
      });
      const applicantName = applicant?.displayName || applicant?.username || "Someone";

      await prisma.notification.create({
        data: {
          userId: job.posterId,
          actorId: userId,
          type: "JOB_APPLICATION",
          message: `${applicantName} applied for your job listing: ${job.title}`,
          actionUrl: `/jobs/applications?jobId=${job.id}`,
          targetId: application.id,
          targetType: "JOB_APPLICATION",
        },
      });
    } catch (notifErr) {
      console.error("Failed to create job application notification", notifErr);
    }

    return NextResponse.json({ data: application });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to submit job application", detail: String(err) },
      { status: 500 }
    );
  }
}

// PATCH /api/professional/jobs/[id]/apply - Update application status (Employer review)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const jobId = params.id;

  try {
    const body = await req.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "applicationId and status are required" },
        { status: 400 }
      );
    }

    // Verify application and authorization
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { company: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.jobId !== jobId) {
      return NextResponse.json(
        { error: "Application does not belong to this job listing" },
        { status: 400 }
      );
    }

    const isPoster = application.job.posterId === userId;
    const isCompanyOwner = application.job.company.ownerId === userId;

    if (!isPoster && !isCompanyOwner) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to update this application status" },
        { status: 403 }
      );
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    // Notify the applicant
    try {
      await prisma.notification.create({
        data: {
          userId: application.applicantId,
          actorId: userId,
          type: "JOB_APPLICATION_STATUS",
          message: `Your application status for "${application.job.title}" has been updated to: ${status}`,
          actionUrl: `/jobs`,
          targetId: application.id,
          targetType: "JOB_APPLICATION",
        },
      });
    } catch (notifErr) {
      console.error("Failed to notify applicant", notifErr);
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update application status", detail: String(err) },
      { status: 500 }
    );
  }
}
