import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/professional/jobs/[id] - Retrieve detailed job specifications
export async function GET(req: NextRequest, { params }: RouteParams) {
  const jobId = params.id;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            description: true,
            location: true,
            size: true,
          },
        },
        poster: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Increment views count asynchronously
    prisma.job
      .update({
        where: { id: jobId },
        data: { viewsCount: { increment: 1 } },
      })
      .catch((e) => console.error("Failed to increment job views", e));

    return NextResponse.json({ data: job });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch job", detail: String(err) },
      { status: 500 }
    );
  }
}

// PUT /api/professional/jobs/[id] - Edit job description or close posting (Poster or Company owner only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const isPoster = job.posterId === userId;
    const isCompanyOwner = job.company.ownerId === userId;

    if (!isPoster && !isCompanyOwner) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to update this job listing" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, requirements, location, type, workplaceType, salary, salaryRange, isActive } = body;

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        description,
        requirements: requirements !== undefined ? (typeof requirements === "string" ? requirements : JSON.stringify(requirements)) : undefined,
        location,
        type,
        workplaceType,
        salary: salary || salaryRange,
        salaryRange: salaryRange || salary,
        isActive,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update job", detail: String(err) },
      { status: 500 }
    );
  }
}
