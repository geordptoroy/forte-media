import { useState, useEffect } from "react";
import { AdCard } from "@/components/ads/AdCard";
import { AdFilters } from "@/components/ads/AdFilters";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { CredentialsWarning } from "@/components/CredentialsWarning";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Zap, TrendingUp, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { usePagination } from "@/hooks/usePagination";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ScaledAds() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [ads, setAds] = useState<unknown[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    {
      countries: ["BR"],
      minSpend: filters.score_min ? Number(filters.score_min) * 100 : undefined,
    },
    {
      // Desabilitado manualmente — controlamos a execução via refetch()
      enabled: false,
      retry: false,
    }
  );

  const { page, totalPages, paginatedItems, setPage, goToNext, goToPrev, hasNext, hasPrev, reset } =
    usePagination(ads, 12);

  // Carrega automaticamente quando as credenciais estiverem disponíveis e ainda não carregou
  useEffect(() => {
    if (
      !hasLoaded &&
      !credentialsStatus.isLoading &&
      credentialsStatus.data?.hasCredentials &&
      credentialsStatus.data?.isValid
    ) {
      handleSearch(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialsStatus.isLoading, credentialsStatus.data?.hasCredentials, credentialsStatus.data?.isValid]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    reset();
    setAds([]);
    setHasLoaded(false);
    setApiError(null);
    setIsPermissionError(false);
  };

  const handleReset = () => {
    setFilters({});
    reset();
    setAds([]);
    setHasLoaded(false);
    setApiError(null);
    setIsPermissionError(false);
  };

  const handleSearch = async (silent = false) => {
    if (!credentialsStatus.data?.hasCredentials) {
      if (!silent) toast.error("Configure suas credenciais Meta primeiro");
      return;
    }
    setIsSearching(true);
    setApiError(null);
    setIsPermissionError(false);
    try {
      const result = await searchScaledAdsQuery.refetch();
      
      // Verificar se há erro na resposta
      if (result.data?.error) {
        setApiError(result.data.error);
        setIsPermissionError(result.data.isPermissionError ?? false);
        setAds([]);
        setHasLoaded(true);
        if (!silent) {
          toast.error(result.data.error);
        }
        return;
      }

      if (result.data?.ads) {
        let filtered: unknown[] = result.data.ads;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter((ad) =>
            (((ad as Record<string, unknown>).page_name as string) || "").toLowerCase().includes(q)
          );
        }
        if (filters.media_type) {
          const mt = filters.media_type.toLowerCase();
          filtered = filtered.filter(
            (ad) =>
              (((ad as Record<string, unknown>).mediaType as string) || "").toLowerCase() === mt
          );
        }
        setAds(filtered);
        setHasLoaded(true);
        reset();
        if (!silent) {
          toast.success(`${filtered.length} anuncio${filtered.length !== 1 ? "s" : ""} escalado${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`);
        }
      } else {
        if (!silent) toast.info("Nenhum anuncio escalado encontrado");
        setAds([]);
        setHasLoaded(true);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Erro ao buscar anuncios escalados";
      setApiError(errMsg);
      if (!silent) {
        toast.error(errMsg);
      }
      setAds([]);
      setHasLoaded(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Anuncios Scaled"
          subtitle="Identifique criativos que estao recebendo alto investimento agora."
          actions={
            <Button
              onClick={() => handleSearch(false)}
              disabled={isSearching || !credentialsStatus.data?.hasCredentials}
              className="btn-premium"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  Sincronizar Escala
                </>
              )}
            </Button>
          }
        />

        {/* Aviso de credenciais */}
        {!credentialsStatus.isLoading && !credentialsStatus.data?.hasCredentials && (
          <CredentialsWarning message="A deteccao de escala exige uma conexao ativa com a Meta Marketing API para analisar volumes de investimento." />
        )}

        {/* Erro de permissão da Ad Library API */}
        {isPermissionError && apiError && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Ad Library API não autorizada:</strong> Sua aplicação Meta precisa de aprovação para acessar a Ads Library.{" "}
              <a
                href="https://developers.facebook.com/docs/marketing-api/reference/ads-archive"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-orange-900"
              >
                Clique aqui para autorizar
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Erro genérico da API */}
        {apiError && !isPermissionError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erro ao buscar anúncios:</strong> {apiError}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <AdFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              <p className="text-sm text-gray-500">Analisando escala de anuncios...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isSearching && (
          <>
            {ads.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="font-bold">
                    {ads.length} anuncio{ads.length !== 1 ? "s" : ""} escalados
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  Pagina {page} de {totalPages}
                </span>
              </div>
            )}

            {ads.length === 0 && hasLoaded && !apiError && (
              <EmptyState
                icon={Zap}
                title="Nenhum anuncio escalado"
                description={
                  credentialsStatus.data?.hasCredentials
                    ? "Clique em Sincronizar Escala para buscar anuncios com alto investimento."
                    : "Configure suas credenciais Meta para detectar anuncios escalados."
                }
                actionLabel={
                  credentialsStatus.data?.hasCredentials
                    ? "Sincronizar Agora"
                    : undefined
                }
                onAction={
                  credentialsStatus.data?.hasCredentials ? () => handleSearch(false) : undefined
                }
                actionDisabled={isSearching}
              />
            )}

            {paginatedItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((ad, i) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <AdCard key={((ad as any).id as string) || String(i)} ad={ad as any} />
                ))}
              </div>
            )}

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPrev={goToPrev}
              onNext={goToNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
