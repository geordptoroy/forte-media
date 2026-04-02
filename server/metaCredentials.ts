import { eq, and } from "drizzle-orm";
import { userMetaCredentials } from "../drizzle/schema";
import { getDb } from "./db";
import { encryptToken, hashToken, decryptToken } from "./crypto";

/**
 * Interface para credenciais completas da Meta (App + Account)
 */
export interface MetaCredentialsConfig {
  metaAppId: string;
  metaAppSecret?: string;
  adAccountId?: string;
  accountName?: string;
  accessToken: string;
  isSystemUser?: boolean;
  systemUserId?: string;
  permissions: string[];
  isValid?: boolean;
}

/**
 * Armazenar credenciais Meta completas de um usuário
 * Suporta múltiplas aplicações Meta por usuário
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

  // Construir condições de filtro para verificar existência
  const conditions = [
    eq(userMetaCredentials.userId, userId),
    eq(userMetaCredentials.metaAppId, config.metaAppId),
  ];
  if (config.adAccountId) {
    conditions.push(eq(userMetaCredentials.adAccountId, config.adAccountId));
  }

  const existing = await db
    .select()
    .from(userMetaCredentials)
    .where(and(...conditions))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar credencial existente
    await db
      .update(userMetaCredentials)
      .set({
        encryptedAccessToken,
        tokenHash,
        encryptedAppSecret,
        adAccountId: config.adAccountId,
        accountName: config.accountName,
        isSystemUser: config.isSystemUser || false,
        systemUserId: config.systemUserId,
        permissions: config.permissions,
        isValid: true,
        lastValidatedAt: new Date(),
        validationError: null,
        updatedAt: new Date(),
      })
      .where(eq(userMetaCredentials.id, existing[0].id));
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
      isSystemUser: config.isSystemUser || false,
      systemUserId: config.systemUserId,
      permissions: config.permissions,
      isValid: true,
      lastValidatedAt: new Date(),
    });
  }
}

/**
 * Obter credenciais Meta descriptografadas de um usuário
 * Se adAccountId for fornecido, retorna apenas as credenciais para essa conta
 */
export async function getMetaCredentials(
  userId: number,
  metaAppId?: string,
  adAccountId?: string
): Promise<(MetaCredentialsConfig & { isValid: boolean }) | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Construir condições de filtro
  const conditions = [eq(userMetaCredentials.userId, userId)];
  if (metaAppId) {
    conditions.push(eq(userMetaCredentials.metaAppId, metaAppId));
  }
  if (adAccountId) {
    conditions.push(eq(userMetaCredentials.adAccountId, adAccountId));
  }

  const result = await db
    .select()
    .from(userMetaCredentials)
    .where(and(...conditions))
    .limit(1);

  if (!result.length) return null;

  const cred = result[0];
  const accessToken = decryptToken(cred.encryptedAccessToken);
  const metaAppSecretDecrypted = cred.encryptedAppSecret ? decryptToken(cred.encryptedAppSecret) : undefined;

  return {
    metaAppId: cred.metaAppId,
    metaAppSecret: metaAppSecretDecrypted,
    adAccountId: cred.adAccountId || undefined,
    accountName: cred.accountName || undefined,
    accessToken,
    isSystemUser: cred.isSystemUser,
    systemUserId: cred.systemUserId || undefined,
    permissions: cred.permissions,
    isValid: cred.isValid,
  };
}

/**
 * Listar todas as credenciais Meta de um usuário
 */
export async function listMetaCredentials(userId: number): Promise<Array<{
  id: number;
  metaAppId: string;
  adAccountId: string | null;
  accountName: string | null;
  isValid: boolean;
  permissions: string[];
}>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      id: userMetaCredentials.id,
      metaAppId: userMetaCredentials.metaAppId,
      adAccountId: userMetaCredentials.adAccountId,
      accountName: userMetaCredentials.accountName,
      isValid: userMetaCredentials.isValid,
      permissions: userMetaCredentials.permissions,
    })
    .from(userMetaCredentials)
    .where(eq(userMetaCredentials.userId, userId));

  return results;
}

/**
 * Validar se as credenciais existem e são válidas
 */
export async function hasValidMetaCredentials(
  userId: number,
  metaAppId?: string,
  adAccountId?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const conditions = [
    eq(userMetaCredentials.userId, userId),
    eq(userMetaCredentials.isValid, true),
  ];
  if (metaAppId) {
    conditions.push(eq(userMetaCredentials.metaAppId, metaAppId));
  }
  if (adAccountId) {
    conditions.push(eq(userMetaCredentials.adAccountId, adAccountId));
  }

  const result = await db
    .select()
    .from(userMetaCredentials)
    .where(and(...conditions))
    .limit(1);

  return result.length > 0;
}

/**
 * Validar token Meta via Graph API
 * Verifica permissões e retorna lista de permissões concedidas
 */
export async function validateMetaToken(
  accessToken: string,
  appSecret?: string
): Promise<{
  valid: boolean;
  permissions: string[];
  error?: string;
}> {
  try {
    const response = await fetch("https://graph.facebook.com/v25.0/me/permissions", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        permissions: [],
        error: `Meta API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { data?: Array<{ permission: string; status: string }> };
    const permissions = data.data
      ?.filter((p) => p.status === "granted")
      .map((p) => p.permission) || [];

    // Verificar permissões mínimas necessárias
    const requiredPermissions = ["ads_read", "ads_management"];
    const hasRequiredPermissions = requiredPermissions.some((p) => permissions.includes(p));

    if (!hasRequiredPermissions) {
      return {
        valid: false,
        permissions,
        error: "Token does not have required permissions (ads_read or ads_management)",
      };
    }

    return {
      valid: true,
      permissions,
    };
  } catch (error) {
    console.error("[Meta] Token validation error:", error);
    return {
      valid: false,
      permissions: [],
      error: error instanceof Error ? error.message : "Unknown error during token validation",
    };
  }
}

/**
 * Validar App ID e App Secret com a Meta
 * Retorna informações sobre a aplicação se válida
 */
export async function validateMetaApp(
  appId: string,
  appSecret: string
): Promise<{
  valid: boolean;
  appName?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${appId}?access_token=${appId}|${appSecret}`
    );

    if (!response.ok) {
      return {
        valid: false,
        error: `Meta API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { id?: string; name?: string };

    return {
      valid: true,
      appName: data.name,
    };
  } catch (error) {
    console.error("[Meta] App validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error during app validation",
    };
  }
}

/**
 * Validar Ad Account ID
 * Verifica se o Ad Account existe e pertence ao usuário
 */
export async function validateAdAccount(
  accessToken: string,
  adAccountId: string
): Promise<{
  valid: boolean;
  accountName?: string;
  currency?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${adAccountId}?fields=name,currency&access_token=${accessToken}`
    );

    if (!response.ok) {
      return {
        valid: false,
        error: `Meta API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { name?: string; currency?: string };

    return {
      valid: true,
      accountName: data.name,
      currency: data.currency,
    };
  } catch (error) {
    console.error("[Meta] Ad account validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error during ad account validation",
    };
  }
}

/**
 * Invalidar credenciais Meta de um usuário
 */
export async function invalidateMetaCredentials(
  userId: number,
  metaAppId?: string,
  adAccountId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(userMetaCredentials.userId, userId)];
  if (metaAppId) {
    conditions.push(eq(userMetaCredentials.metaAppId, metaAppId));
  }
  if (adAccountId) {
    conditions.push(eq(userMetaCredentials.adAccountId, adAccountId));
  }

  await db
    .update(userMetaCredentials)
    .set({ isValid: false, updatedAt: new Date() })
    .where(and(...conditions));
}

/**
 * Remover credenciais Meta de um usuário
 */
export async function deleteMetaCredentials(
  userId: number,
  credentialId?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (credentialId) {
    await db
      .delete(userMetaCredentials)
      .where(
        and(
          eq(userMetaCredentials.id, credentialId),
          eq(userMetaCredentials.userId, userId)
        )
      );
  } else {
    await db.delete(userMetaCredentials).where(eq(userMetaCredentials.userId, userId));
  }
}

/**
 * Atualizar status de validação de credenciais
 */
export async function updateCredentialValidation(
  credentialId: number,
  isValid: boolean,
  error?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userMetaCredentials)
    .set({
      isValid,
      validationError: error || null,
      lastValidatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userMetaCredentials.id, credentialId));
}
