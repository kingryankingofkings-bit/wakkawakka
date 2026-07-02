import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const placementHeader = req.headers.get("x-ad-placement");

    // Fetch all active ads with their placements
    const activeAds = await prisma.ad.findMany({
      where: {
        isActive: true,
      },
      include: {
        placements: true,
      },
    });

    // Filter by budget spent
    let availableAds = activeAds.filter((ad) => ad.spent < ad.budget);

    // Filter by placement target if requested
    if (placementHeader) {
      availableAds = availableAds.filter((ad) => {
        if (ad.placements.length > 0) {
          return ad.placements.some(
            (p) => p.type.toUpperCase() === placementHeader.toUpperCase(),
          );
        }
        return true; // General ads without explicit placements can serve anywhere
      });
    }

    if (availableAds.length === 0) {
      return NextResponse.json({ data: null });
    }

    // Calculate user's age
    let age: number | null = null;
    if (user.birthdate) {
      const birth = new Date(user.birthdate);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // Determine deterministic user gender for targeting
    const hash =
      user.id.charCodeAt(0) + (user.id.charCodeAt(user.id.length - 1) || 0);
    const userGender =
      hash % 3 === 0 ? "Female" : hash % 3 === 1 ? "Male" : "Other";

    // Match targeting criteria
    const targetedAds = availableAds.filter((ad) => {
      // 1. Age targeting
      if (ad.ageMin !== null && (age === null || age < ad.ageMin)) return false;
      if (ad.ageMax !== null && (age === null || age > ad.ageMax)) return false;

      // 2. Gender targeting
      if (
        ad.gender &&
        ad.gender.toLowerCase() !== "all" &&
        ad.gender.toLowerCase() !== userGender.toLowerCase()
      )
        return false;

      // 3. Location targeting
      if (ad.location && ad.location.toLowerCase() !== "all") {
        if (
          !user.location ||
          !user.location.toLowerCase().includes(ad.location.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });

    // Fall back to general active ads if targeted ads is empty
    const adsToServe = targetedAds.length > 0 ? targetedAds : availableAds;

    // Return a random ad campaign
    const randomIndex = Math.floor(Math.random() * adsToServe.length);
    const selectedAd = adsToServe[randomIndex];

    return NextResponse.json({ data: selectedAd });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to serve ad", detail: String(err) },
      { status: 500 },
    );
  }
}
