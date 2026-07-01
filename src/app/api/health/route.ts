import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================================================
// WakkaWakka — Health Check Endpoint
// GET /api/health — Verifies app + database connectivity.
// =============================================================================

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  let dbStatus: "connected" | "error" = "error";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    // Simple query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  const status = dbStatus === "connected" ? "ok" : "degraded";
  const httpStatus = dbStatus === "connected" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      responseTimeMs: Date.now() - start,
    },
    { status: httpStatus },
  );
}
