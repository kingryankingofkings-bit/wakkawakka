import { z } from "zod";

// =============================================================================
// WakkaWakka — Environment Variable Validation
// Fail-fast at startup if required vars are missing.
// =============================================================================

const envSchema = z.object({
  // ── App ──────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("WakkaWakka"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // ── Authentication ───────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .default(""),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),

  // ── Firebase ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),

  // ── Email ────────────────────────────────────────────────────────────────
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_FROM: z.string().optional(),

  // ── Socket / Real-time ───────────────────────────────────────────────────
  NEXT_PUBLIC_SOCKET_URL: z.string().optional(),
  SOCKET_PORT: z.coerce.number().optional(),

  // ── Uploads ──────────────────────────────────────────────────────────────
  UPLOAD_PROVIDER: z.enum(["local", "firebase", "cloudinary"]).default("local"),
  UPLOAD_DIR: z.string().default("./public/uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),

  // ── Rate Limiting ────────────────────────────────────────────────────────
  RATE_LIMIT_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(20),

  // ── Security ─────────────────────────────────────────────────────────────
  ADMIN_SETUP_SECRET: z.string().optional(),

  // ── Monitoring ───────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional(),

  // ── Feature Flags ────────────────────────────────────────────────────────
  NEXT_PUBLIC_ENABLE_LIVE_STREAMS: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  NEXT_PUBLIC_ENABLE_AUDIO_ROOMS: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  NEXT_PUBLIC_ENABLE_MARKETPLACE: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  NEXT_PUBLIC_MAINTENANCE_MODE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables. In development mode, missing
 * JWT_SECRET is tolerated with a warning. In production it is fatal.
 */
function parseEnv(): Env {
  const raw = { ...process.env };

  // In development, allow a fallback JWT_SECRET with a loud warning
  if (
    (!raw.JWT_SECRET || raw.JWT_SECRET.length < 32) &&
    raw.NODE_ENV !== "production"
  ) {
    const fallback =
      "dev-only-secret-do-not-use-in-prod-" +
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    if (!raw.JWT_SECRET) {
      console.warn(
        "\x1b[33m⚠ JWT_SECRET is not set — using insecure dev fallback. " +
          "Set a proper secret before deploying.\x1b[0m",
      );
    }
    raw.JWT_SECRET = raw.JWT_SECRET || fallback;
  }

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(
      `\x1b[31m✖ Invalid environment variables:\n${formatted}\x1b[0m`,
    );
    // Fatal in production — tolerate in development for partial setups
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration");
    }
  }

  return (result.success ? result.data : envSchema.parse({ ...raw, JWT_SECRET: raw.JWT_SECRET || "dev-fallback-secret-placeholder-minimum-32-chars" })) as Env;
}

/** Validated, type-safe environment variables. */
export const env = parseEnv();

/** Convenience check for production mode. */
export const isProduction = env.NODE_ENV === "production";

/** Convenience check for development mode. */
export const isDevelopment = env.NODE_ENV === "development";
