// =============================================================================
// WakkaWakka — Structured Logger
// JSON-formatted logging with levels, timestamps, and context.
// Replaces raw console.log across the codebase.
// =============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    // Structured JSON for production log aggregation
    return JSON.stringify(entry);
  }
  // Human-readable for development
  const prefix = {
    debug: "\x1b[36m[DEBUG]\x1b[0m",
    info: "\x1b[32m[INFO]\x1b[0m",
    warn: "\x1b[33m[WARN]\x1b[0m",
    error: "\x1b[31m[ERROR]\x1b[0m",
  }[entry.level];
  const ctx = entry.context ? ` \x1b[90m(${entry.context})\x1b[0m` : "";
  const reqId = entry.requestId ? ` \x1b[90mreq:${entry.requestId}\x1b[0m` : "";
  const dataStr =
    entry.data && Object.keys(entry.data).length > 0
      ? ` ${JSON.stringify(entry.data)}`
      : "";
  const errStr = entry.error
    ? `\n  ${entry.error.name}: ${entry.error.message}${entry.error.stack ? `\n  ${entry.error.stack}` : ""}`
    : "";
  return `${prefix}${ctx}${reqId} ${entry.message}${dataStr}${errStr}`;
}

function log(
  level: LogLevel,
  message: string,
  options?: {
    context?: string;
    requestId?: string;
    data?: Record<string, unknown>;
    error?: unknown;
  },
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: options?.context,
    requestId: options?.requestId,
    data: options?.data,
  };

  if (options?.error) {
    const err =
      options.error instanceof Error
        ? options.error
        : new Error(String(options.error));
    entry.error = {
      name: err.name,
      message: err.message,
      // Only include stack traces in development to prevent information disclosure
      stack:
        process.env.NODE_ENV !== "production" ? err.stack : undefined,
    };
  }

  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Create a scoped logger with a fixed context string.
 *
 * ```ts
 * const log = createLogger("SocketIO");
 * log.info("Client connected", { data: { socketId: "abc" } });
 * ```
 */
export function createLogger(context: string) {
  return {
    debug: (
      message: string,
      options?: { requestId?: string; data?: Record<string, unknown> },
    ) => log("debug", message, { ...options, context }),

    info: (
      message: string,
      options?: { requestId?: string; data?: Record<string, unknown> },
    ) => log("info", message, { ...options, context }),

    warn: (
      message: string,
      options?: {
        requestId?: string;
        data?: Record<string, unknown>;
        error?: unknown;
      },
    ) => log("warn", message, { ...options, context }),

    error: (
      message: string,
      options?: {
        requestId?: string;
        data?: Record<string, unknown>;
        error?: unknown;
      },
    ) => log("error", message, { ...options, context }),
  };
}

/** Default application logger. */
export const logger = createLogger("App");
