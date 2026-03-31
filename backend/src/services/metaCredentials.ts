import { eq } from "drizzle-orm";
import { userMetaCredentials } from "../drizzle/schema";
import { getDb } from "./db";
import { encryptToken, hashToken, decryptToken, validateTokenHash } from "./crypto";

/**
 * Armazenar credenciais Meta de um usuário
 */
export async function storeMetaCredentials(
  userId: number,
  accessToken: string,
  permissions: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const encryptedToken = encryptToken(accessToken);
  const tokenHash = hashToken(accessToken);

  await db
    .insert(userMetaCredentials)
    .values({
      userId,
      encryptedAccessToken: encryptedToken,
      tokenHash,
      permissions,
      isValid: true,
      lastValidatedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        encryptedAccessToken: encryptedToken,
        tokenHash,
        permissions,
        isValid: true,
        lastValidatedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Obter credenciais Meta descriptografadas de um usuário
 */
export async function getMetaCredentials(userId: number): Promise<{
  accessToken: string;
  permissions: string[];
  isValid: boolean;
} | null> {
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

  return {
    accessToken,
    permissions: cred.permissions,
    isValid: cred.isValid,
  };
}

/**
 * Validar se as credenciais existem e são válidas
 */
export async function hasValidMetaCredentials(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(userMetaCredentials)
    .where(eq(userMetaCredentials.userId, userId))
    .limit(1);

  if (!result.length) return false;

  return result[0].isValid;
}

/**
 * Validar token Meta via Graph API
 * Retorna as permissões do token se válido
 */
export async function validateMetaToken(accessToken: string): Promise<{
  valid: boolean;
  permissions: string[];
  error?: string;
}> {
  try {
    const response = await fetch("https://graph.facebook.com/v19.0/me/permissions", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        permissions: [],
        error: `Meta API returned ${response.status}`,
      };
    }

    const data = (await response.json()) as { data?: Array<{ permission: string; status: string }> };
    const permissions = data.data
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
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Invalidar credenciais Meta de um usuário
 */
export async function invalidateMetaCredentials(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userMetaCredentials)
    .set({ isValid: false, updatedAt: new Date() })
    .where(eq(userMetaCredentials.userId, userId));
}

/**
 * Remover credenciais Meta de um usuário
 */
export async function deleteMetaCredentials(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userMetaCredentials).where(eq(userMetaCredentials.userId, userId));
}
