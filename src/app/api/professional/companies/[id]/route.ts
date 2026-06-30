import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/professional/companies/[id] - Fetch details of a specific company by slug or ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  const identifier = params.id;

  try {
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            followers: true,
            jobs: true,
          },
        },
        jobs: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        }
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ data: company });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch company details", detail: String(err) },
      { status: 500 }
    );
  }
}

// PUT /api/professional/companies/[id] - Update company profile (Owner only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const identifier = params.id;

  try {
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ]
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not the owner of this company" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, logoUrl, coverImage, website, industry, size, companySize, location, headquarters } = body;

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name,
        description,
        logoUrl,
        coverImage,
        website,
        industry,
        size: size || companySize,
        companySize: companySize || size,
        location: location || headquarters,
        headquarters: headquarters || location,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update company", detail: String(err) },
      { status: 500 }
    );
  }
}
