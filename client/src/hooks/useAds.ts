import { trpc } from "@/lib/trpc";

/**
 * Hook para buscar os anuncios favoritos do utilizador a partir do backend real.
 * Substitui a versao anterior que continha apenas dados mock (Math.random).
 */
export function useFavoriteAds() {
  return trpc.ads.getFavorites.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });
}

/**
 * Hook para buscar os anuncios monitorados do utilizador a partir do backend real.
 */
export function useMonitoredAds() {
  return trpc.monitoring.getMonitored.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });
}

/**
 * Hook para buscar as campanhas do utilizador a partir do backend real.
 */
export function useCampaigns() {
  return trpc.meta.listCampaigns.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });
}
