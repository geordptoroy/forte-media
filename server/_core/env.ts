export const ENV = {
  // Support both SESSION_SECRET (new) and JWT_SECRET (legacy) for backward compatibility
  cookieSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
