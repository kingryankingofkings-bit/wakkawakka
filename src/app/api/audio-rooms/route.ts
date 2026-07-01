import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/audio-rooms - List active audio rooms
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    const rooms = await prisma.audioRoom.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          }
        },
        speakers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              }
            }
          }
        },
        listeners: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/audio-rooms - Create an audio room
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, tags } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const room = await prisma.audioRoom.create({
      data: {
        hostId: userId,
        title,
        description: description || null,
        category: category || null,
        tags: tags ? JSON.stringify(tags) : "[]",
        isActive: true,
        startedAt: new Date(),
        speakers: {
          create: {
            userId: userId,
            isMuted: false,
          }
        }
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          }
        },
        speakers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              }
            }
          }
        },
        listeners: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
