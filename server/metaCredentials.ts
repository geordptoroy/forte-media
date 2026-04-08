/**
 * Meta Credentials Service — v4 (Limpeza Total)
 * ─────────────────────────────────────────────────────────────────────────────
 * Agora as credenciais são lidas exclusivamente do META_ACCESS_TOKEN no .env.
 */

export interface MetaCredentialsConfig {
  accessToken: string;
  permissions: string[];
}

/**
 * Obter credenciais Meta diretamente do ambiente (.env)
 */
export async function getMetaCredentials(
  _userId: number // Mantido para compatibilidade de assinatura
): Promise<(MetaCredentialsConfig & { isValid: boolean }) | null> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    permissions: ["ads_read", "ads_management", "pages_read_engagement"],
    isValid: true,
  };
}

/**
 * Funções legadas mantidas como no-op para evitar quebra de código
 */
export async function storeMetaCredentials(_userId: number, _config: any): Promise<void> {
  // No-op: Credenciais agora são via .env
}

export async function deleteMetaCredentials(_userId: number): Promise<void> {
  // No-op: Credenciais agora são via .env
}

export async function validateMetaToken(_accessToken: string): Promise<{ valid: boolean; permissions: string[] }> {
  return { valid: true, permissions: [] };
}
