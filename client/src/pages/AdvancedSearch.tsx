import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdCard } from '@/components/ads/AdCard';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Search, Loader2, AlertCircle, Settings, Filter, Globe, Layers } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdvancedSearch() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    keywords: '',
    media_type: '',
    country: 'BR',
    ad_type: 'ALL' as 'ALL' | 'POLITICAL' | 'ISSUE_ADS',
  });
  const [ads, setAds] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const searchAdsQuery = trpc.meta.searchAds.useQuery(
    {
      searchTerms: filters.keywords ? filters.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [''],
      countries: [filters.country || 'BR'],
      adType: filters.ad_type as any,
      limit: 50,
    },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!credentialsStatus.data?.isValid) {
      toast.error('Configure suas credenciais Meta primeiro');
      setLocation('/settings');
      return;
    }
    if (!filters.keywords.trim()) {
      toast.error('Insira pelo menos uma palavra-chave');
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    setPage(1);
    try {
      const result = await searchAdsQuery.refetch();
      if (result.data?.success && result.data?.ads) {
        let filtered = result.data.ads;
        if (filters.media_type) {
          filtered = filtered.filter((ad: any) => ad.media_type === filters.media_type);
        }
        setAds(filtered);
        toast.success(`${filtered.length} anúncios encontrados`);
      } else if (result.data?.error) {
        toast.error(result.data.error);
        setAds([]);
      } else {
        toast.info('Nenhum anúncio encontrado');
        setAds([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar anúncios');
      setAds([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE));
  const paginatedAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Busca Avançada</h1>
            <p className="text-gray-500 font-medium">Filtros granulares para encontrar exatamente o que você precisa na Meta Ad Library.</p>
          </div>
          
          <Button
            onClick={handleSearch}
            disabled={isSearching || !credentialsStatus.data?.isValid}
            className="btn-premium px-8"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Executar Busca
              </span>
            )}
          </Button>
        </div>

        {/* Credentials Warning */}
        {!credentialsStatus.data?.isValid && !credentialsStatus.isLoading && (
          <Card className="card-premium bg-yellow-500/5 border-yellow-500/20 p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Acesso à API Requerido</p>
              <p className="text-xs text-gray-400 mt-1">
                A busca avançada utiliza a API oficial da Meta. Configure seu token em Configurações para continuar.
              </p>
            </div>
          </Card>
        )}

        {/* Search Form */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
          <div className="flex items-center gap-2 mb-8">
            <Filter className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Parâmetros de Pesquisa</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Palavras-chave</label>
              <Input
                placeholder="Ex: iPhone, Promoção, Black Friday..."
                value={filters.keywords}
                onChange={(e) => setFilters((prev) => ({ ...prev, keywords: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="input-premium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Região</label>
              <Select
                value={filters.country}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, country: value }))}
              >
                <SelectTrigger className="input-premium h-11">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="País" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="BR">Brasil</SelectItem>
                  <SelectItem value="US">Estados Unidos</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="ES">Espanha</SelectItem>
                  <SelectItem value="AR">Argentina</SelectItem>
                  <SelectItem value="MX">México</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Formato</label>
              <Select
                value={filters.media_type}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, media_type: value }))}
              >
                <SelectTrigger className="input-premium h-11">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Todos" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !credentialsStatus.data?.isValid}
              className="btn-premium px-8"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Filtrar Anúncios"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ keywords: '', media_type: '', country: 'BR', ad_type: 'ALL' });
                setAds([]);
                setHasSearched(false);
              }}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white"
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
              {ads.length > 0 ? `${ads.length} Resultados encontrados` : "Resultados da Pesquisa"}
            </h2>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white/5 h-80 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : hasSearched && ads.length === 0 ? (
            <Card className="card-premium bg-white/[0.01] border-white/5 p-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Search className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nada encontrado</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Tente simplificar suas palavras-chave ou alterar a região da busca.
              </p>
            </Card>
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
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed">
              <Layers className="w-12 h-12 text-gray-800 mb-6" />
              <h3 className="text-lg font-bold text-white mb-2">Aguardando Parâmetros</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Preencha as palavras-chave acima para iniciar uma busca profunda na biblioteca de anúncios da Meta.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
