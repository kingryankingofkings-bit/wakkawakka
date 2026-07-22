import { createLogger } from "@/lib/logger";

const log = createLogger("EnvValidator");

/**
 * Validate critical environment variables on startup.
 */
export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !process.env.JWT_SECRET) {
    log.error("FATAL: JWT_SECRET environment variable is missing in production!");
  }

  if (isProduction && !process.env.DATABASE_URL) {
    log.error("FATAL: DATABASE_URL environment variable is missing in production!");
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    log.info("NEXT_PUBLIC_APP_URL not set — using default fallback http://localhost:3000");
  }
}

// Auto-run validation when imported
validateEnv();
