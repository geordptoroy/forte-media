import { Ad, Favorite, Monitoring } from '../types';

const SPEND_RANGES = [
  '0-999', '1000-9999', '10000-49999', '50000-99999',
  '100000-499999', '500000-999999', '1000000+',
];

const IMPRESSIONS_RANGES = [
  '0-9999', '10000-99999', '100000-499999', '500000-999999',
  '1000000-4999999', '5000000-9999999', '10000000+',
];

const PAGE_NAMES = [
  'Natura Cosméticos', 'Magazine Luiza', 'Americanas', 'Casas Bahia',
  'iFood', 'Nubank', 'Mercado Livre', 'Shopee Brasil', 'Amazon Brasil',
  'Boticário', 'Renner', 'C&A Brasil', 'Riachuelo', 'Lojas Marisa',
  'Ponto Frio', 'Fast Shop', 'Netshoes', 'Centauro', 'Decathlon Brasil',
  'Leroy Merlin', 'Tok&Stok', 'Mobly', 'Westwing', 'Etna',
];

const TRENDS: Array<'growing' | 'stable' | 'declining'> = ['growing', 'stable', 'declining'];
const MEDIA_TYPES: Array<'image' | 'video' | 'carousel'> = ['image', 'video', 'carousel'];
const COUNTRIES = ['BR', 'US', 'PT', 'AR', 'MX', 'CO'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculateScore(
  spendRange: string,
  impressionsRange: string,
  daysActive: number,
  trend: 'growing' | 'stable' | 'declining'
): number {
  const SPEND_POINTS: Record<string, number> = {
    '0-999': 0, '1000-9999': 2, '10000-49999': 4, '50000-99999': 6,
    '100000-499999': 8, '500000-999999': 10, '1000000+': 12,
  };
  const IMPRESSIONS_POINTS: Record<string, number> = {
    '0-9999': 0, '10000-99999': 2, '100000-499999': 4, '500000-999999': 6,
    '1000000-4999999': 8, '5000000-9999999': 10, '10000000+': 12,
  };
  const spendPoints = SPEND_POINTS[spendRange] || 0;
  const impressionsPoints = IMPRESSIONS_POINTS[impressionsRange] || 0;
  const durationPoints = daysActive <= 7 ? 1 : daysActive <= 30 ? 3 : daysActive <= 90 ? 5 : 7;
  const trendPoints = trend === 'growing' ? 3 : trend === 'stable' ? 1 : 0;
  return spendPoints + impressionsPoints + durationPoints + trendPoints;
}

export function generateMockAds(count = 50): Ad[] {
  return Array.from({ length: count }, (_, i) => {
    const spendRange = randomItem(SPEND_RANGES.slice(2));
    const impressionsRange = randomItem(IMPRESSIONS_RANGES.slice(2));
    const daysActive = randomInt(7, 180);
    const trend = randomItem(TRENDS);
    const score = calculateScore(spendRange, impressionsRange, daysActive, trend);
    return {
      id: `ad_${String(i + 1).padStart(4, '0')}`,
      page_id: `page_${randomInt(1000, 9999)}`,
      page_name: randomItem(PAGE_NAMES),
      creative_url: `https://picsum.photos/seed/ad${i + 1}/400/300`,
      spend_range: spendRange,
      impressions_range: impressionsRange,
      days_active: daysActive,
      score,
      is_scaled: score >= 18,
      trend,
      media_type: randomItem(MEDIA_TYPES),
      countries: [randomItem(COUNTRIES), randomItem(COUNTRIES)].filter(
        (v, i, a) => a.indexOf(v) === i
      ),
      created_at: new Date(Date.now() - daysActive * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

export const MOCK_ADS = generateMockAds(100);

export const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@fortemedia.com',
};

export function getMockDashboardStats() {
  const scaledAds = MOCK_ADS.filter((a) => a.is_scaled);
  return {
    total_scaled_ads: scaledAds.length,
    avg_spend: 'R$50.000 - R$99.999',
    total_pages: new Set(MOCK_ADS.map((a) => a.page_id)).size,
    trend_percent: 12.5,
  };
}

export function getMockChartData() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      scaled_ads: randomInt(20, 60) + (30 - i),
    });
  }
  return data;
}

export function getMockTopAdvertisers() {
  const counts: Record<string, number> = {};
  MOCK_ADS.filter((a) => a.is_scaled).forEach((ad) => {
    counts[ad.page_name] = (counts[ad.page_name] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

export function getMockRecentAds() {
  return MOCK_ADS.filter((a) => a.is_scaled)
    .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
    .slice(0, 5);
}

export function getMockAdHistory(adId: string) {
  const history = [];
  const baseScore = randomInt(15, 25);
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split('T')[0],
      score: Math.min(35, baseScore + Math.floor((30 - i) / 5) + randomInt(-1, 2)),
    });
  }
  return history;
}

export function getMockFavorites(userId: number): Favorite[] {
  return MOCK_ADS.slice(0, 5).map((ad, i) => ({
    id: i + 1,
    user_id: userId,
    ad_id: ad.id,
    folder_name: i < 2 ? 'Concorrentes' : 'Geral',
    notes: i === 0 ? 'Anúncio muito eficaz, estudar copy.' : undefined,
    created_at: new Date().toISOString(),
    ad,
  }));
}

export function getMockMonitoring(userId: number): Monitoring[] {
  return MOCK_ADS.slice(5, 10).map((ad, i) => ({
    id: i + 1,
    user_id: userId,
    ad_id: ad.id,
    alert_config: {
      score_increase: true,
      spend_increase: false,
      email_notifications: true,
      threshold: 25,
    },
    created_at: new Date().toISOString(),
    ad,
  }));
}
