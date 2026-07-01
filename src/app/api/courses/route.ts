import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { canCreateCourse } from "@/lib/courseVerification";
import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000),
  isPremium: z.boolean().default(false),
  category: z.string().default("General"),
  level: z.string().default("BEGINNER"),
  modulesList: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = createCourseSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const isPaid = validated.data.isPremium;
    
    // Pass user to validation
    const verification = canCreateCourse(user as any, isPaid);
    
    if (!verification.allowed) {
      return NextResponse.json({ error: verification.reason }, { status: 403 });
    }

    const course = await prisma.learningCourse.create({
      data: {
        title: validated.data.title,
        description: validated.data.description,
        isPremium: validated.data.isPremium,
        instructor: user.username,
        category: validated.data.category,
        level: validated.data.level,
        modulesList: validated.data.modulesList,
      }
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    console.error("Course creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    
    const whereClause: any = {};
    if (category && category !== "all") {
      whereClause.category = category;
    }

    const courses = await prisma.learningCourse.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error("Course fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
