import { eq } from "drizzle-orm";
import { userMetaCredentials } from "../drizzle/schema";
import { getDb } from "./db";
import { encryptToken, hashToken, decryptToken } from "./crypto";

/**
 * Interface para credenciais da Meta (Access Token fornecido pelo usuário)
 */
export interface MetaCredentialsConfig {
  accessToken: string;
  metaAppId?: string;
  metaAppSecret?: string;
  adAccountId?: string;
  accountName?: string;
  permissions: string[];
}

// Versão da Graph API — atualizada para v21.0
const GRAPH_API_VERSION = "v21.0";

/**
 * Armazenar ou atualizar credenciais Meta de um usuário
 */
export async function storeMetaCredentials(
  userId: number,
  config: MetaCredentialsConfig
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const encryptedAccessToken = encryptToken(config.accessToken);
  const tokenHash = hashToken(config.accessToken);
  const encryptedAppSecret = config.metaAppSecret ? encryptToken(config.metaAppSecret) : null;

  const existing = await db
    .select()
    .from(userMetaCredentials)
    .where(eq(userMetaCredentials.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar credencial existente
    await db
      .update(userMetaCredentials)
      .set({
        encryptedAccessToken,
        tokenHash,
        metaAppId: config.metaAppId || null,
        encryptedAppSecret,
        adAccountId: config.adAccountId || null,
        accountName: config.accountName || null,
        permissions: config.permissions,
        isValid: true,
        lastValidatedAt: new Date(),
        validationError: null,
        updatedAt: new Date(),
      })
      .where(eq(userMetaCredentials.userId, userId));
  } else {
    // Inserir nova credencial
    await db.insert(userMetaCredentials).values({
      userId,
      metaAppId: config.metaAppId,
      encryptedAppSecret,
      adAccountId: config.adAccountId,
      accountName: config.accountName,
      encryptedAccessToken,
      tokenHash,
      permissions: config.permissions,
      isValid: true,
      lastValidatedAt: new Date(),
    });
  }
}

/**
 * Obter credenciais Meta descriptografadas de um usuário
 */
export async function getMetaCredentials(
  userId: number
): Promise<(MetaCredentialsConfig & { isValid: boolean }) | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userMetaCredentials)
    .where(eq(userMetaCredentials.userId, userId))
    .limit(1);

  if (!result.length) return null;

  const cred = result[0];
  const accessToken = decryptToken(cred.encryptedAccessToken);
  const metaAppSecretDecrypted = cred.encryptedAppSecret ? decryptToken(cred.encryptedAppSecret) : undefined;

  return {
    metaAppId: cred.metaAppId || undefined,
    metaAppSecret: metaAppSecretDecrypted,
    adAccountId: cred.adAccountId || undefined,
    accountName: cred.accountName || undefined,
    accessToken,
    permissions: cred.permissions,
    isValid: cred.isValid,
  };
}

/**
 * Validar token Meta via Graph API
 */
export async function validateMetaToken(
  accessToken: string
): Promise<{
  valid: boolean;
  permissions: string[];
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/permissions`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: { message?: string } };
      return {
        valid: false,
        permissions: [],
        error:
          errorData?.error?.message ||
          `Meta API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as {
      data?: Array<{ permission: string; status: string }>;
    };
    const permissions =
      data.data
        ?.filter((p) => p.status === "granted")
        .map((p) => p.permission) || [];

    return {
      valid: true,
      permissions,
    };
  } catch (error) {
    console.error("[Meta] Token validation error:", error);
    return {
      valid: false,
      permissions: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during token validation",
    };
  }
}

/**
 * Remover credenciais Meta de um usuário
 */
export async function deleteMetaCredentials(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userMetaCredentials).where(eq(userMetaCredentials.userId, userId));
}
