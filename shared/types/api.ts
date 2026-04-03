/**
 * Tipos compartilhados para a API
 * Utilizados tanto no frontend quanto no backend
 */

// ============================================================================
// Tipos de Resposta Padrão
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Tipos de Anúncios
// ============================================================================

export interface AdMetrics {
  min?: number;
  max?: number;
  range?: string;
}

export interface AdData {
  id: string;
  pageId: string;
  pageName: string;
  adSnapshotUrl?: string;
  adDeliveryStartTime?: Date;
  adDeliveryStopTime?: Date;
  publisherPlatforms?: string[];
  adCreativeBodies?: string[];
  spend?: AdMetrics;
  impressions?: AdMetrics;
  demographicDistribution?: Record<string, number>;
  regionDistribution?: Record<string, number>;
}

export interface FavoriteAdData extends AdData {
  isFavorited: boolean;
  createdAt: Date;
}

export interface MonitoredAdData extends AdData {
  monitoringStatus: "active" | "paused" | "completed";
  isStillActive: boolean;
  lastCheckedAt?: Date;
  notes?: string;
}

// ============================================================================
// Tipos de Campanhas
// ============================================================================

export interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions?: number;
  conversionValue?: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

export interface CampaignData extends CampaignMetrics {
  id: number;
  campaignId: string;
  campaignName: string;
  status: "active" | "paused" | "completed" | "archived";
  objective?: string;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  lastSyncedAt?: Date;
}

// ============================================================================
// Tipos de Credenciais Meta
// ============================================================================

export interface MetaCredentialsStatus {
  hasCredentials: boolean;
  isValid: boolean;
  accountName?: string;
  permissions?: string[];
}

// ============================================================================
// Tipos de Busca
// ============================================================================

export interface SearchFilters {
  searchTerms?: string[];
  countries: string[];
  media_type?: string;
  ad_type?: "ALL" | "POLITICAL" | "ISSUE_ADS";
  minSpend?: number;
  maxSpend?: number;
}

export interface SearchResults {
  ads: AdData[];
  total: number;
  paging?: {
    cursors?: {
      after?: string;
      before?: string;
    };
  };
}

// ============================================================================
// Tipos de Usuário
// ============================================================================

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Tipos de Notificações
// ============================================================================

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
