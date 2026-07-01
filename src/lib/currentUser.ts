import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

// =============================================================================
// WakkaWakka — Current User Resolution
// Resolves the acting user from JWT cookie/header with dev-only fallbacks.
// =============================================================================

const log = createLogger("CurrentUser");

/**
 * Resolve the acting user ID for an API request.
 *
 * Auth priority:
 * 1. `auth-token` cookie (JWT — primary)
 * 2. `Authorization: Bearer <token>` header
 * 3. `x-user-id` header (dev-only — logged as deprecation warning)
 * 4. `userId` query param (dev-only — logged as deprecation warning)
 * 5. `bodyUserId` parameter (dev-only — logged as deprecation warning)
 *
 * Returns the user id string, or null if none could be resolved.
 */
export async function getRequestUserId(
  req: NextRequest,
  bodyUserId?: string,
): Promise<string | null> {
  // 1. Try auth-token cookie (primary secure path)
  const cookieToken = req.cookies.get("auth-token")?.value;
  if (cookieToken) {
    const payload = await verifyToken(cookieToken);
    const id =
      (payload?.userId as string) ?? (payload?.id as string) ?? null;
    if (id) return id;
  }

  // 2. Try Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    const id =
      (payload?.userId as string) ?? (payload?.id as string) ?? null;
    if (id) return id;
  }

  // ── Dev-only fallbacks (disabled in production) ──────────────────────────
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const header = req.headers.get("x-user-id");
  if (header) {
    log.warn("Auth via x-user-id header (dev-only, disabled in production)", {
      data: { userId: header },
    });
    return header;
  }

  const q = req.nextUrl.searchParams.get("userId");
  if (q) {
    log.warn("Auth via userId query param (dev-only, disabled in production)", {
      data: { userId: q },
    });
    return q;
  }

  if (bodyUserId) {
    log.warn("Auth via body userId (dev-only, disabled in production)", {
      data: { userId: bodyUserId },
    });
    return bodyUserId;
  }

  return null;
}

/**
 * Resolve the acting user record (id + a few display fields). Returns null when
 * the user cannot be found or the database is unreachable.
 */
export async function getRequestUser(req: NextRequest, bodyUserId?: string) {
  const id = await getRequestUserId(req, bodyUserId);
  if (!id) return null;
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        isVerified: true,
        verificationTier: true,
      },
    });
  } catch {
    return null;
  }
}

/** Stable ordering for a friendship pair so (a,b) and (b,a) map to one row. */
export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
