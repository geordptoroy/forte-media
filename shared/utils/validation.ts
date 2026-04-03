import { z } from "zod";

/**
 * Esquemas de validação compartilhados
 * Utilizados tanto no frontend quanto no backend
 */

// ============================================================================
// Validações de Busca
// ============================================================================

export const searchFiltersSchema = z.object({
  searchTerms: z.array(z.string()).optional(),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  media_type: z.string().optional(),
  ad_type: z.enum(["ALL", "POLITICAL", "ISSUE_ADS"]).optional(),
  minSpend: z.number().min(0).optional(),
  maxSpend: z.number().min(0).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// ============================================================================
// Validações de Campanhas
// ============================================================================

export const campaignMetricsSchema = z.object({
  spend: z.number().min(0),
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  conversions: z.number().int().min(0).optional(),
  conversionValue: z.number().min(0).optional(),
  roas: z.number().min(0).optional(),
  ctr: z.number().min(0).optional(),
  cpc: z.number().min(0).optional(),
  cpm: z.number().min(0).optional(),
});

export type CampaignMetrics = z.infer<typeof campaignMetricsSchema>;

// ============================================================================
// Validações de Anúncios
// ============================================================================

export const adMetricsSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  range: z.string().optional(),
});

export type AdMetrics = z.infer<typeof adMetricsSchema>;

// ============================================================================
// Validações de Credenciais Meta
// ============================================================================

export const metaCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  accountId: z.string().min(1, "Account ID is required"),
  accountName: z.string().optional(),
});

export type MetaCredentials = z.infer<typeof metaCredentialsSchema>;

// ============================================================================
// Funções Utilitárias
// ============================================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateCountryCode(code: string): boolean {
  // ISO 3166-1 alpha-2 country codes
  const validCodes = [
    "BR", "US", "CA", "MX", "AR", "CL", "CO", "PE", "VE",
    "GB", "FR", "DE", "IT", "ES", "PT", "NL", "BE", "AT",
    "AU", "NZ", "JP", "CN", "IN", "KR", "SG", "MY", "TH",
  ];
  return validCodes.includes(code.toUpperCase());
}

export function validatePageId(pageId: string): boolean {
  // Facebook page IDs are typically numeric strings
  return /^\d+$/.test(pageId);
}

export function validateAdId(adId: string): boolean {
  // Meta ad IDs are typically numeric or alphanumeric strings
  return /^[a-zA-Z0-9_-]+$/.test(adId) && adId.length > 0;
}
