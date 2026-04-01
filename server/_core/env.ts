export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  // Support both SESSION_SECRET (new) and JWT_SECRET (legacy) for backward compatibility
  cookieSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
