import { trpc } from "@/lib/trpc";

/**
 * Hook centralizado para verificar o status das credenciais Meta do utilizador.
 * Evita duplicação de lógica nas páginas que dependem de credenciais configuradas.
 */
export function useMetaCredentials() {
  const query = trpc.meta.getCredentialsStatus.useQuery(undefined, {
    retry: false,
    staleTime: 30_000, // 30 segundos de cache
  });

  return {
    hasCredentials: query.data?.hasCredentials ?? false,
    isValid: query.data?.isValid ?? false,
    accountName: query.data?.accountName ?? null,
    permissions: query.data?.permissions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
