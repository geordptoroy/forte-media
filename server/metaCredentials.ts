/**
 * Meta Credentials Service — v3 (Refatorado para .env)
 * ─────────────────────────────────────────────────────────────────────────────
 * Agora as credenciais são lidas diretamente das variáveis de ambiente,
 * removendo a necessidade de armazenamento em banco de dados por usuário.
 */

export interface MetaCredentialsConfig {
  accessToken: string;
  metaAppId?: string;
  metaAppSecret?: string;
  adAccountId?: string;
  accountName?: string;
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
    metaAppId: process.env.META_APP_ID,
    metaAppSecret: process.env.META_APP_SECRET,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
    accountName: process.env.META_ACCOUNT_NAME || "Conta Padrão",
    permissions: ["ads_read", "ads_management", "pages_read_engagement"], // Permissões padrão assumidas
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
