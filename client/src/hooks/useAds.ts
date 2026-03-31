import { useQuery } from '@tanstack/react-query';

export function useScaledAds(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['scaled-ads', params],
    queryFn: async () => {
      // Simular dados de anúncios escalados
      return {
        data: Array.from({ length: 12 }).map((_, i) => ({
          id: `ad-${i}`,
          page_name: `Anúncio ${i + 1}`,
          creative_url: `https://picsum.photos/seed/${i}/400/300`,
          score: Math.floor(Math.random() * 30) + 10,
          spend: Math.floor(Math.random() * 5000) + 100,
          impressions: Math.floor(Math.random() * 100000) + 10000,
          days_active: Math.floor(Math.random() * 30) + 1,
          media_type: ['image', 'video', 'carousel'][Math.floor(Math.random() * 3)],
        })),
        total_pages: 10,
      };
    },
  });
}

export function useAdDetail(id: string) {
  return useQuery({
    queryKey: ['ad', id],
    queryFn: async () => {
      // Simular dados de detalhe do anúncio
      return {
        id,
        page_name: `Anúncio ${id}`,
        creative_url: `https://picsum.photos/seed/${id}/400/300`,
        score: Math.floor(Math.random() * 30) + 10,
        spend: Math.floor(Math.random() * 5000) + 100,
        impressions: Math.floor(Math.random() * 100000) + 10000,
        days_active: Math.floor(Math.random() * 30) + 1,
        media_type: 'image',
      };
    },
    enabled: !!id,
  });
}

export function useAdHistory(id: string) {
  return useQuery({
    queryKey: ['ad-history', id],
    queryFn: async () => {
      // Simular histórico do anúncio
      return Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        spend: Math.floor(Math.random() * 1000) + 100,
        impressions: Math.floor(Math.random() * 50000) + 5000,
      }));
    },
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Simular estatísticas do dashboard
      return {
        total_ads: Math.floor(Math.random() * 10000) + 1000,
        total_spend: Math.floor(Math.random() * 1000000) + 100000,
        total_impressions: Math.floor(Math.random() * 100000000) + 10000000,
        avg_score: Math.floor(Math.random() * 20) + 10,
      };
    },
  });
}

export function useDashboardChart() {
  return useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: async () => {
      // Simular dados do gráfico
      return Array.from({ length: 30 }).map((_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        spend: Math.floor(Math.random() * 50000) + 10000,
        impressions: Math.floor(Math.random() * 5000000) + 1000000,
      }));
    },
  });
}

export function useTopAdvertisers() {
  return useQuery({
    queryKey: ['top-advertisers'],
    queryFn: async () => {
      // Simular top anunciantes
      return Array.from({ length: 10 }).map((_, i) => ({
        id: `advertiser-${i}`,
        name: `Anunciante ${i + 1}`,
        spend: Math.floor(Math.random() * 500000) + 50000,
        ads_count: Math.floor(Math.random() * 100) + 10,
      }));
    },
  });
}

export function useRecentAds() {
  return useQuery({
    queryKey: ['recent-ads'],
    queryFn: async () => {
      // Simular anúncios recentes
      return Array.from({ length: 5 }).map((_, i) => ({
        id: `ad-recent-${i}`,
        page_name: `Anúncio Recente ${i + 1}`,
        creative_url: `https://picsum.photos/seed/recent-${i}/400/300`,
        score: Math.floor(Math.random() * 30) + 10,
        spend: Math.floor(Math.random() * 5000) + 100,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      }));
    },
  });
}
