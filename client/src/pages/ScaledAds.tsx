import { useState } from 'react';
import { AdCard } from '@/components/ads/AdCard';
import { AdFilters } from '@/components/ads/AdFilters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Zap, Settings } from 'lucide-react';

export default function ScaledAds() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    {
      countries: ['BR'],
      minSpend: filters.score_min ? Number(filters.score_min) * 100 : 1000,
    },
    { enabled: false }
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
    setAds([]);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!credentialsStatus.data?.isValid) {
      toast.error('Configure suas credenciais Meta primeiro');
      setLocation('/settings');
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.ads) {
        let filtered = result.data.ads;
        // Filtrar por busca de texto se houver
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter((ad: any) =>
            (ad.page_name || '').toLowerCase().includes(q)
          );
        }
        // Filtrar por tipo de mídia
        if (filters.media_type) {
          filtered = filtered.filter((ad: any) => ad.media_type === filters.media_type);
        }
        setAds(filtered);
        toast.success(`${filtered.length} anúncios escalados encontrados`);
      } else if (result.data?.error) {
        toast.error(result.data.error);
        setAds([]);
      } else {
        toast.info('Nenhum anúncio escalado encontrado');
        setAds([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar anúncios escalados');
      setAds([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Paginação local
  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE));
  const paginatedAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (credentialsStatus.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credentials Warning */}
      {!credentialsStatus.data?.isValid && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Credenciais Meta não configuradas
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                Configure suas credenciais para acessar dados reais de anúncios escalados
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation('/settings')}
              className="border-yellow-400 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-100 dark:hover:bg-yellow-900"
            >
              <Settings className="w-4 h-4 mr-1" strokeWidth={2} />
              Configurar
            </Button>
          </div>
        </Card>
      )}

      {/* Filters + Search Button */}
      <div className="space-y-3">
        <AdFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSearch}
            disabled={isSearching || !credentialsStatus.data?.isValid}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={2} />
                Buscando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" strokeWidth={2} />
                Buscar Anúncios Escalados
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {isSearching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-muted h-64 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : hasSearched && ads.length === 0 ? (
        <Card className="border-border/50 p-12 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum anúncio escalado encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou verifique suas credenciais Meta
          </p>
        </Card>
      ) : !hasSearched ? (
        <Card className="border-border/50 p-12 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Anúncios Escalados
          </h3>
          <p className="text-muted-foreground mb-6">
            Descubra anúncios com alto investimento que estão a escalar no mercado
          </p>
          <Button
            onClick={handleSearch}
            disabled={!credentialsStatus.data?.isValid}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Zap className="w-4 h-4 mr-2" strokeWidth={2} />
            Iniciar Busca
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ads.length} anúncio{ads.length !== 1 ? 's' : ''} encontrado{ads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedAds.map((ad) => (
              <AdCard key={ad.id || ad.ad_archive_id} ad={ad} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
