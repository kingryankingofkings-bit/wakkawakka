import { cookies } from "next/headers";
import { createLogger } from "@/lib/logger";

// =============================================================================
// WakkaWakka — Authentication (JWT)
// Uses HMAC-SHA256 with constant-time signature comparison.
// =============================================================================

const log = createLogger("Auth");

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: JWT_SECRET is not set. Cannot run in production without it.",
    );
  }
  if (!secret) {
    log.warn(
      "JWT_SECRET is not set — using insecure dev fallback. Set a proper secret before deploying.",
    );
    return "dev-only-secret-do-not-use-in-prod-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  }
  return secret;
}

// Simple base64url encoding without external deps
function base64url(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function createToken(
  payload: Record<string, unknown>,
): Promise<string> {
  const secret = getJwtSecret();
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const body = base64url(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp }),
  );
  const crypto = await import("crypto");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export async function verifyToken(
  token: string,
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const secret = getJwtSecret();
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete("auth-token");
}
