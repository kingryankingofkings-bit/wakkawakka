import { NextResponse } from "next/server";

// =============================================================================
// WakkaWakka — Standardized API Response Helpers
// Consistent response shapes across all 120+ API routes.
// =============================================================================

/**
 * Standardized error codes used across the API.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

interface ErrorDetail {
  field?: string;
  message: string;
}

interface ApiError {
  code: ErrorCodeType;
  message: string;
  details?: ErrorDetail[];
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
}

// ── Success Responses ──────────────────────────────────────────────────────

/** Return a success response with data. */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** Return a paginated success response. */
export function apiPaginated<T>(data: T[], meta: PaginationMeta) {
  return NextResponse.json({ data, meta }, { status: 200 });
}

/** Return a success response with no content. */
export function apiNoContent() {
  return new NextResponse(null, { status: 204 });
}

// ── Error Responses ────────────────────────────────────────────────────────

/** Return a structured error response. */
export function apiError(
  code: ErrorCodeType,
  message: string,
  status: number,
  details?: ErrorDetail[],
) {
  const error: ApiError = { code, message };
  if (details && details.length > 0) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}

/** 400 Bad Request */
export function apiBadRequest(message = "Bad request", details?: ErrorDetail[]) {
  return apiError(ErrorCode.BAD_REQUEST, message, 400, details);
}

/** 401 Unauthorized */
export function apiUnauthorized(message = "Authentication required") {
  return apiError(ErrorCode.UNAUTHORIZED, message, 401);
}

/** 403 Forbidden */
export function apiForbidden(message = "Insufficient permissions") {
  return apiError(ErrorCode.FORBIDDEN, message, 403);
}

/** 404 Not Found */
export function apiNotFound(resource = "Resource") {
  return apiError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
}

/** 409 Conflict */
export function apiConflict(message = "Resource already exists") {
  return apiError(ErrorCode.CONFLICT, message, 409);
}

/** 429 Rate Limited */
export function apiRateLimited(retryAfterSeconds?: number) {
  const res = apiError(
    ErrorCode.RATE_LIMITED,
    "Too many requests. Please try again later.",
    429,
  );
  if (retryAfterSeconds) {
    res.headers.set("Retry-After", String(retryAfterSeconds));
  }
  return res;
}

/** 500 Internal Server Error — never expose raw error details to clients. */
export function apiInternalError(message = "An unexpected error occurred") {
  return apiError(ErrorCode.INTERNAL_ERROR, message, 500);
}
