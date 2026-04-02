import { useState } from 'react';
import { AdCard } from '@/components/ads/AdCard';
import { AdFilters } from '@/components/ads/AdFilters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Zap, Settings, TrendingUp, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ScaledAds() {
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
    if (!credentialsStatus.data?.hasCredentials) {
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
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter((ad: any) =>
            (ad.page_name || '').toLowerCase().includes(q)
          );
        }
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

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE));
  const paginatedAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Anúncios Scaled</h1>
            <p className="text-gray-500 font-medium">Identifique criativos que estão recebendo alto investimento agora.</p>
          </div>
          
          <Button
            onClick={handleSearch}
            disabled={isSearching || !credentialsStatus.data?.hasCredentials}
            className="btn-premium px-8"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Sincronizar Escala
              </span>
            )}
          </Button>
        </div>

        {/* Credentials Warning */}
        {!credentialsStatus.data?.hasCredentials && !credentialsStatus.isLoading && (
          <Card className="card-premium bg-yellow-500/5 border-yellow-500/20 p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Acesso à API Requerido</p>
              <p className="text-xs text-gray-400 mt-1">
                A detecção de escala exige uma conexão ativa com a Meta Marketing API para analisar volumes de investimento.
              </p>
              <Button
                variant="link"
                onClick={() => setLocation('/settings')}
                className="text-white hover:text-gray-300 text-xs font-bold uppercase tracking-widest p-0 h-auto mt-4"
              >
                Configurar agora <Settings className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* Filters Area */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Parâmetros de Escala</h2>
          </div>
          
          <AdFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </Card>

        {/* Results Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
              {ads.length > 0 ? `${ads.length} Anúncios em Escala` : "Tendências de Investimento"}
            </h2>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white/5 h-80 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : ads.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedAds.map((ad) => (
                  <AdCard key={ad.id || ad.ad_archive_id} ad={ad} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
                  >
                    Anterior
                  </Button>
                  <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-xs font-bold text-white">
                      {page} / {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="card-premium bg-white/[0.01] border-white/5 p-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Zap className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Descubra o que está escalando</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Clique no botão de sincronização para buscar anúncios com alto volume de investimento nas últimas 24 horas.
              </p>
              <Button
                onClick={handleSearch}
                disabled={!credentialsStatus.data?.hasCredentials}
                className="btn-premium px-8"
              >
                Ver Tendências Atuais
              </Button>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
