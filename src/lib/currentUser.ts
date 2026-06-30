import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolve the acting user for an API request.
 *
 * The client is expected to send `x-user-id` (set by the auth store). We fall
 * back to a `userId` query param or JSON body field for convenience. This keeps
 * parity with the existing API routes, which trust a client-supplied id.
 *
 * Returns the user id string, or null if none could be resolved.
 */
export function getRequestUserId(
  req: NextRequest,
  bodyUserId?: string,
): string | null {
  const header = req.headers.get("x-user-id");
  if (header) return header;
  const q = req.nextUrl.searchParams.get("userId");
  if (q) return q;
  return bodyUserId ?? null;
}

/**
 * Resolve the acting user record (id + a few display fields). Returns null when
 * the user cannot be found or the database is unreachable.
 */
export async function getRequestUser(req: NextRequest, bodyUserId?: string) {
  const id = getRequestUserId(req, bodyUserId);
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
