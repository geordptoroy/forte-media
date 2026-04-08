import "dotenv/config";

/**
 * Centralized Environment Configuration
 * Includes validation to ensure critical variables are present at startup.
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "ENCRYPTION_KEY",
  "SESSION_SECRET",
] as const;

function validateEnv() {
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

validateEnv();

export const ENV = {
  // Core
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4000", 10),

  // Auth & Security
  cookieSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "default-secret-change-me",
  encryptionKey: process.env.ENCRYPTION_KEY || "default-encryption-key-32-chars-!!",
  
  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // External APIs
  metaAccessToken: process.env.META_ACCESS_TOKEN || "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
};
