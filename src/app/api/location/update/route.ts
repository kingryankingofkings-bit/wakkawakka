import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { latitude, longitude, shareLocation } = body;

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 },
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: "latitude must be between -90 and 90" },
        { status: 400 },
      );
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "longitude must be between -180 and 180" },
        { status: 400 },
      );
    }

    // Upsert UserLocation
    const userLocation = await prisma.userLocation.upsert({
      where: { userId },
      create: {
        userId,
        latitude: lat,
        longitude: lng,
        shareLocation: shareLocation !== false,
      },
      update: {
        latitude: lat,
        longitude: lng,
        shareLocation: shareLocation !== false,
      },
    });

    return NextResponse.json({ data: userLocation });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update location", detail: String(err) },
      { status: 500 },
    );
  }
}
