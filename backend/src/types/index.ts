export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  created_at?: string;
}

export interface Ad {
  id: string;
  page_id: string;
  page_name: string;
  creative_url?: string;
  spend_range: string;
  impressions_range: string;
  days_active: number;
  score: number;
  is_scaled: boolean;
  trend?: 'growing' | 'stable' | 'declining';
  media_type?: 'image' | 'video' | 'carousel';
  countries?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AdSnapshot {
  id: number;
  ad_id: string;
  score: number;
  spend_range: string;
  impressions_range: string;
  snapshot_date: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  ad_id: string;
  folder_name: string;
  notes?: string;
  created_at?: string;
  ad?: Ad;
}

export interface Monitoring {
  id: number;
  user_id: number;
  ad_id: string;
  alert_config?: AlertConfig;
  created_at?: string;
  ad?: Ad;
}

export interface AlertConfig {
  score_increase?: boolean;
  spend_increase?: boolean;
  email_notifications?: boolean;
  threshold?: number;
}

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  filters: SearchFilters;
  created_at?: string;
}

export interface SearchFilters {
  keywords?: string;
  keyword_operator?: 'AND' | 'OR';
  countries?: string[];
  media_type?: string;
  date_start?: string;
  date_end?: string;
  spend_min?: number;
  spend_max?: number;
  score_min?: number;
  page?: string;
}

export interface DashboardStats {
  total_scaled_ads: number;
  avg_spend: string;
  total_pages: number;
  trend_percent: number;
}

export interface AuthRequest {
  email: string;
  password: string;
  name?: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
