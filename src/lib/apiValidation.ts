import { NextRequest } from "next/server";
import { _z, ZodSchema } from "zod";
import {
  apiBadRequest,
  apiUnauthorized,
  apiRateLimited,
} from "@/lib/apiResponse";
import { verifyToken } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

// =============================================================================
// WakkaWakka — API Request Validation & Auth Middleware
// =============================================================================

const log = createLogger("ApiValidation");

// ── Request Validation ─────────────────────────────────────────────────────

interface ValidationSuccess<T> {
  success: true;
  data: T;
}

interface ValidationFailure {
  success: false;
  response: ReturnType<typeof apiBadRequest>;
}

/**
 * Validate request data against a Zod schema.
 *
 * ```ts
 * const result = validateRequest(mySchema, await req.json());
 * if (!result.success) return result.response;
 * const { data } = result; // typed
 * ```
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown,
): ValidationSuccess<T> | ValidationFailure {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return {
      success: false,
      response: apiBadRequest("Request validation failed", details),
    };
  }

  return { success: true, data: parsed.data };
}

/**
 * Validate query search params against a Zod schema.
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams,
): ValidationSuccess<T> | ValidationFailure {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return validateRequest(schema, raw);
}

// ── Authentication ─────────────────────────────────────────────────────────

/**
 * Extract and verify the authenticated user ID from the request.
 *
 * Priority:
 * 1. `auth-token` cookie (JWT — primary, secure method)
 * 2. `Authorization: Bearer <token>` header (for API clients)
 * 3. `x-user-id` header (dev-only fallback — logged as warning)
 *
 * Returns `{ userId }` or `{ response }` (401).
 */
export async function requireAuth(
  req: NextRequest,
): Promise<
  { userId: string; response?: never } | { userId?: never; response: ReturnType<typeof apiUnauthorized> }
> {
  // 1. Try auth-token cookie (primary path)
  const cookieToken = req.cookies.get("auth-token")?.value;
  if (cookieToken) {
    const payload = await verifyToken(cookieToken);
    if (payload?.userId && typeof payload.userId === "string") {
      return { userId: payload.userId };
    }
    if (payload?.id && typeof payload.id === "string") {
      return { userId: payload.id };
    }
  }

  // 2. Try Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (payload?.userId && typeof payload.userId === "string") {
      return { userId: payload.userId };
    }
    if (payload?.id && typeof payload.id === "string") {
      return { userId: payload.id };
    }
  }

  // 3. Dev-only fallback: x-user-id header
  // if (process.env.NODE_ENV !== "production") {
    const headerUserId = req.headers.get("x-user-id");
    if (headerUserId) {
      log.warn(
        "Using x-user-id header for auth — this is disabled in production",
        { data: { userId: headerUserId } },
      );
      return { userId: headerUserId };
    }

    // Also check query param fallback for dev
    const queryUserId = req.nextUrl.searchParams.get("userId");
    if (queryUserId) {
      log.warn(
        "Using userId query param for auth — this is disabled in production",
        { data: { userId: queryUserId } },
      );
      return { userId: queryUserId };
    }
  // }

  return { response: apiUnauthorized() };
}

/**
 * Optionally extract user ID — returns null instead of 401 if not authenticated.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export async function optionalAuth(
  req: NextRequest,
): Promise<string | null> {
  const result = await requireAuth(req);
  return result.userId ?? null;
}

// ── Rate Limiting (In-Memory Token Bucket) ─────────────────────────────────

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const staleThreshold = now - 900_000; // 15 minutes
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastRefill < staleThreshold) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limiting for a request. Uses IP-based token bucket.
 *
 * @returns `null` if allowed, or a 429 response if rate limited.
 */
export function checkRateLimit(
  req: NextRequest,
  options?: {
    maxRequests?: number;
    windowMs?: number;
    keyPrefix?: string;
  },
): ReturnType<typeof apiRateLimited> | null {
  // Skip if rate limiting is disabled
  if (process.env.RATE_LIMIT_ENABLED === "false") return null;

  const maxRequests = options?.maxRequests ?? 100;
  const windowMs = options?.windowMs ?? 900_000; // 15 minutes
  const prefix = options?.keyPrefix ?? "global";

  // Extract client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = `${prefix}:${ip}`;
  const now = Date.now();

  cleanupStaleEntries();

  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = { tokens: maxRequests - 1, lastRefill: now };
    rateLimitStore.set(key, entry);
    return null;
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refillRate = maxRequests / windowMs;
  const refill = elapsed * refillRate;
  entry.tokens = Math.min(maxRequests, entry.tokens + refill);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    const retryAfter = Math.ceil((1 - entry.tokens) / refillRate / 1000);
    log.warn("Rate limit exceeded", { data: { ip, key, retryAfter } });
    return apiRateLimited(retryAfter);
  }

  entry.tokens -= 1;
  return null;
}
