import { useQuery } from '@tanstack/react-query';
import { adsApi, dashboardApi } from '../services/api';

export function useScaledAds(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['scaled-ads', params],
    queryFn: () => adsApi.scaled(params),
  });
}

export function useAdDetail(id: string) {
  return useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsApi.getById(id),
    enabled: !!id,
  });
}

export function useAdHistory(id: string) {
  return useQuery({
    queryKey: ['ad-history', id],
    queryFn: () => adsApi.history(id),
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
  });
}

export function useDashboardChart() {
  return useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: dashboardApi.chart,
  });
}

export function useTopAdvertisers() {
  return useQuery({
    queryKey: ['top-advertisers'],
    queryFn: dashboardApi.topAdvertisers,
  });
}

export function useRecentAds() {
  return useQuery({
    queryKey: ['recent-ads'],
    queryFn: dashboardApi.recent,
  });
}
