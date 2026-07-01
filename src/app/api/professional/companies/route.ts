import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/companies - Search or list companies
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const slug = req.nextUrl.searchParams.get("slug") || "";

  try {
    if (slug) {
      const company = await prisma.company.findUnique({
        where: { slug },
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
        },
      });
      return NextResponse.json({ data: company });
    }

    const companies = await prisma.company.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { industry: { contains: query } },
            ],
          }
        : {},
      include: {
        _count: {
          select: {
            followers: true,
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json({ data: companies });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch companies", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/companies - Create a company
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, logoUrl, coverImage, website, industry, size, companySize, location, headquarters } = body;

    if (!name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // Generate unique slug
    let baseSlug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!baseSlug) {
      baseSlug = "company";
    }
    let slug = baseSlug;
    let count = 1;
    while (true) {
      const existing = await prisma.company.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${count}`;
      count++;
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        description,
        logoUrl,
        coverImage,
        website,
        industry,
        size: size || companySize,
        companySize: companySize || size,
        location: location || headquarters,
        headquarters: headquarters || location,
        ownerId: userId,
      },
    });

    // Automatically join owner as ADMIN member
    await prisma.companyMember.create({
      data: {
        companyId: company.id,
        userId: userId,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ data: company });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create company", detail: String(err) },
      { status: 500 }
    );
  }
}
