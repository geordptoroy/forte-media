/**
 * Meta Credentials Service — v4 (Limpeza Total)
 * ─────────────────────────────────────────────────────────────────────────────
 * Agora as credenciais são lidas exclusivamente do META_ACCESS_TOKEN no .env.
 */

import { ENV } from "./_core/env";

export interface MetaCredentialsConfig {
  accessToken: string;
  permissions: string[];
}

export const META_TOKEN_MISSING_ERROR =
  "Meta Access Token não configurado no servidor. Verifique a variável META_ACCESS_TOKEN no backend.";

const INVALID_META_TOKEN_PLACEHOLDERS = new Set([
  "seu_access_token_aqui",
  "your_access_token_here",
  "meta_access_token_here",
]);

function sanitizeAccessToken(token?: string | null): string | null {
  const normalized = token?.trim();

  if (!normalized || INVALID_META_TOKEN_PLACEHOLDERS.has(normalized)) {
    return null;
  }

  return normalized;
}

export function getServerMetaAccessToken(): string | null {
  return sanitizeAccessToken(ENV.metaAccessToken || process.env.META_ACCESS_TOKEN);
}

/**
 * Obter credenciais Meta diretamente do ambiente (.env)
 */
export async function getMetaCredentials(
  _userId: number // Mantido para compatibilidade de assinatura
): Promise<(MetaCredentialsConfig & { isValid: boolean }) | null> {
  const accessToken = getServerMetaAccessToken();

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    permissions: ["ads_read", "ads_management", "pages_read_engagement"],
    isValid: true,
  };
}

export async function requireMetaCredentials(userId: number): Promise<MetaCredentialsConfig & { isValid: boolean }> {
  const credentials = await getMetaCredentials(userId);

  if (!credentials?.isValid) {
    throw new Error(META_TOKEN_MISSING_ERROR);
  }

  return credentials;
}
