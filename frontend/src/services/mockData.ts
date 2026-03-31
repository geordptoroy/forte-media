import {
  Ad, DashboardStats, ChartData, TopAdvertiser,
  Favorite, Monitoring, AuthResponse,
} from '../types/api.types';

const PAGE_NAMES = [
  'Natura Cosméticos', 'Magazine Luiza', 'Americanas', 'Casas Bahia',
  'iFood', 'Nubank', 'Mercado Livre', 'Shopee Brasil', 'Amazon Brasil',
  'Boticário', 'Renner', 'C&A Brasil', 'Riachuelo', 'Lojas Marisa',
  'Ponto Frio', 'Fast Shop', 'Netshoes', 'Centauro', 'Decathlon Brasil',
  'Leroy Merlin',
];

const SPEND_RANGES = ['10000-49999', '50000-99999', '100000-499999', '500000-999999', '1000000+'];
const IMPRESSIONS_RANGES = ['100000-499999', '500000-999999', '1000000-4999999', '5000000-9999999', '10000000+'];
const TRENDS: Array<'growing' | 'stable' | 'declining'> = ['growing', 'stable', 'declining'];
const MEDIA_TYPES: Array<'image' | 'video' | 'carousel'> = ['image', 'video', 'carousel'];

function ri(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function ra<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function calcScore(spend: string, imp: string, days: number, trend: string): number {
  const sp: Record<string, number> = { '10000-49999': 4, '50000-99999': 6, '100000-499999': 8, '500000-999999': 10, '1000000+': 12 };
  const ip: Record<string, number> = { '100000-499999': 4, '500000-999999': 6, '1000000-4999999': 8, '5000000-9999999': 10, '10000000+': 12 };
  const dp = days <= 7 ? 1 : days <= 30 ? 3 : days <= 90 ? 5 : 7;
  const tp = trend === 'growing' ? 3 : trend === 'stable' ? 1 : 0;
  return (sp[spend] || 0) + (ip[imp] || 0) + dp + tp;
}

export const MOCK_ADS: Ad[] = Array.from({ length: 80 }, (_, i) => {
  const spend = ra(SPEND_RANGES);
  const imp = ra(IMPRESSIONS_RANGES);
  const days = ri(7, 180);
  const trend = ra(TRENDS);
  const score = calcScore(spend, imp, days, trend);
  return {
    id: `ad_${String(i + 1).padStart(4, '0')}`,
    page_id: `page_${ri(1000, 9999)}`,
    page_name: ra(PAGE_NAMES),
    creative_url: `https://picsum.photos/seed/ad${i + 1}/400/300`,
    spend_range: spend,
    impressions_range: imp,
    days_active: days,
    score,
    is_scaled: score >= 18,
    trend,
    media_type: ra(MEDIA_TYPES),
    countries: ['BR'],
    created_at: new Date(Date.now() - days * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
});

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  total_scaled_ads: MOCK_ADS.filter(a => a.is_scaled).length,
  avg_spend: 'R$50K–R$100K',
  total_pages: new Set(MOCK_ADS.map(a => a.page_id)).size,
  trend_percent: 12.5,
};

export const MOCK_CHART_DATA: ChartData[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return { date: d.toISOString().split('T')[0], scaled_ads: ri(20, 60) + i };
});

export const MOCK_TOP_ADVERTISERS: TopAdvertiser[] = (() => {
  const counts: Record<string, number> = {};
  MOCK_ADS.filter(a => a.is_scaled).forEach(ad => { counts[ad.page_name] = (counts[ad.page_name] || 0) + 1; });
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }));
})();

export const MOCK_RECENT_ADS: Ad[] = MOCK_ADS.filter(a => a.is_scaled).slice(0, 5);

export function getMockAdHistory(adId: string) {
  const base = ri(15, 25);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().split('T')[0], score: Math.min(35, base + Math.floor(i / 5) + ri(-1, 2)) };
  });
}

export const MOCK_FAVORITES: Favorite[] = MOCK_ADS.slice(0, 5).map((ad, i) => ({
  id: i + 1,
  user_id: 1,
  ad_id: ad.id,
  folder_name: i < 2 ? 'Concorrentes' : 'Geral',
  notes: i === 0 ? 'Anúncio muito eficaz, estudar copy.' : undefined,
  created_at: new Date().toISOString(),
  ad,
}));

export const MOCK_MONITORING: Monitoring[] = MOCK_ADS.slice(5, 10).map((ad, i) => ({
  id: i + 1,
  user_id: 1,
  ad_id: ad.id,
  alert_config: { score_increase: true, spend_increase: false, email_notifications: true, threshold: 25 },
  created_at: new Date().toISOString(),
  ad,
}));

export const MOCK_AUTH_RESPONSE: AuthResponse = {
  token: 'mock_token_forte_media_demo',
  user: { id: 1, name: 'Demo User', email: 'demo@fortemedia.com' },
};
