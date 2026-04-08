import { trpc } from '@/lib/trpc';

/**
 * Hook para buscar os anúncios favoritos do utilizador a partir do backend real.
 */
export function useFavoriteAds() {
  return trpc.ads.getFavorites.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });
}
