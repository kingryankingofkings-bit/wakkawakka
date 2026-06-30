import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/memories — retrieves memories for the authenticated user
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const onThisDay = req.nextUrl.searchParams.get("onThisDay") === "true";

    const dbMemories = await prisma.savedMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();
    const currentYear = now.getUTCFullYear();

    let filtered = dbMemories;

    if (onThisDay) {
      filtered = dbMemories.filter((m) => {
        const d = new Date(m.createdAt);
        return (
          d.getUTCMonth() === currentMonth &&
          d.getUTCDate() === currentDay &&
          d.getUTCFullYear() < currentYear
        );
      });
    }

    const memories = filtered.map((m) => {
      let pipUrl = null;
      let location = "";
      let tags: string[] = [];

      if (m.caption) {
        try {
          const parsed = JSON.parse(m.caption);
          pipUrl = parsed.pipUrl || null;
          location = parsed.location || "";
          tags = parsed.tags || [];
        } catch (e) {
          location = m.caption;
        }
      }

      return {
        id: m.id,
        url: m.mediaUrl,
        pipUrl,
        mode: m.type,
        date: m.createdAt.toISOString().split("T")[0],
        createdAt: m.createdAt.toISOString(),
        location,
        tags,
      };
    });

    return NextResponse.json({
      data: memories,
      meta: { total: memories.length },
    });
  } catch (err) {
    return NextResponse.json({
      data: [],
      meta: { total: 0 },
      detail: String(err),
    }, { status: 500 });
  }
}

// POST /api/memories — creates a new saved memory
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, pipUrl, mode, location, tags, latitude, longitude } = body;

    if (!url || !mode) {
      return NextResponse.json({ error: "url and mode are required" }, { status: 400 });
    }

    const captionJson = JSON.stringify({
      pipUrl: pipUrl || null,
      location: location || "",
      tags: tags || [],
    });

    const savedMemory = await prisma.savedMemory.create({
      data: {
        userId,
        mediaUrl: url,
        type: mode,
        caption: captionJson,
        latitude: typeof latitude === "number" ? latitude : null,
        longitude: typeof longitude === "number" ? longitude : null,
      },
    });

    const responseData = {
      id: savedMemory.id,
      url: savedMemory.mediaUrl,
      pipUrl: pipUrl || null,
      mode: savedMemory.type,
      date: savedMemory.createdAt.toISOString().split("T")[0],
      createdAt: savedMemory.createdAt.toISOString(),
      location: location || "",
      tags: tags || [],
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      error: "Failed to save memory",
      detail: String(err),
    }, { status: 500 });
  }
}
