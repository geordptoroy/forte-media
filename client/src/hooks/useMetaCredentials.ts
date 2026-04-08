import { trpc } from '@/lib/trpc';

/**
 * Hook centralizado para verificar o status das credenciais Meta do utilizador.
 * Evita duplicação de lógica nas páginas que dependem de credenciais configuradas.
 */
export function useMetaCredentials() {
  const query = trpc.meta.getCredentialsStatus.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  return {
    hasCredentials: query.data?.hasCredentials ?? false,
    isValid: query.data?.isValid ?? false,
    permissions: query.data?.permissions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
