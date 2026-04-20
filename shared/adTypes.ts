export interface ExtractionResult {
  type: 'video' | 'image' | 'carousel' | 'unknown';
  url: string | string[];
  thumbnail?: string;
  title?: string;
  ctaLink?: string;
}

export interface AdData {
  id: string;
  ad_creation_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url: string;
  currency?: string;
  page_id: string;
  page_name: string;
  publisher_platforms?: string[];
  spend?: {
    lower_bound: string;
    upper_bound?: string;
  };
  impressions?: {
    lower_bound: string;
    upper_bound?: string;
  };
  detectedTypes: string[];
  detectedFunnels: string[];
  isNegative?: boolean;
  frequency?: number;
  collationCount?: number;
  creativeHash?: string;
  creative_group_id?: string; // ID único do grupo de criativos (gerado no backend)
  isFirstInGroup?: boolean;
  destination_url?: string;
  daysActive?: number;
  bylines?: string;
}
