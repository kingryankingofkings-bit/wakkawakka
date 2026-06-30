import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/jobs - Search/filter active jobs
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");
  const search = req.nextUrl.searchParams.get("search") || req.nextUrl.searchParams.get("query") || "";
  const type = req.nextUrl.searchParams.get("type");
  const workplaceType = req.nextUrl.searchParams.get("workplaceType");

  try {
    const whereClause: any = { isActive: true };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (workplaceType) {
      whereClause.workplaceType = workplaceType;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            size: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: jobs });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch jobs", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/jobs - Create a job posting (Owner or Member only)
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { companyId, title, description, requirements, location, type, workplaceType, salary, salaryRange } = body;

    if (!companyId || !title || !description) {
      return NextResponse.json(
        { error: "companyId, title, and description are required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { members: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify user association with the company (owner or member)
    const isOwner = company.ownerId === userId;
    const isMember = company.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to post jobs for this company" },
        { status: 403 }
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements: typeof requirements === "string" ? requirements : JSON.stringify(requirements || []),
        location,
        type: type || "FULL_TIME",
        workplaceType: workplaceType || "ON_SITE",
        salary: salary || salaryRange,
        salaryRange: salaryRange || salary,
        companyId,
        posterId: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ data: job });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create job", detail: String(err) },
      { status: 500 }
    );
  }
}
