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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdCard } from '@/components/ads/AdCard';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Search, Loader2, AlertCircle, Settings } from 'lucide-react';

export default function AdvancedSearch() {
  const { isAuthenticated } = useAuth();
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

  // Paginação local
  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE));
  const paginatedAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Credentials Warning */}
      {credentialsStatus.data && !credentialsStatus.data.isValid && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Credenciais Meta não configuradas
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                Configure suas credenciais para realizar buscas reais na Ad Library
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation('/settings')}
              className="border-yellow-400 text-yellow-900 dark:text-yellow-100"
            >
              <Settings className="w-4 h-4 mr-1" strokeWidth={2} />
              Configurar
            </Button>
          </div>
        </Card>
      )}

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Busca Avançada de Anúncios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Palavras-chave</label>
              <Input
                placeholder="Ex: produto, marca, serviço (separados por vírgula)"
                value={filters.keywords}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keywords: e.target.value }))
                }
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Select
                value={filters.country}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, country: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
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
              <label className="text-sm font-medium">Tipo de mídia</label>
              <Select
                value={filters.media_type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, media_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de mídia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
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
                  <Search className="w-4 h-4 mr-2" strokeWidth={2} />
                  Buscar Anúncios
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ keywords: '', media_type: '', country: 'BR', ad_type: 'ALL' });
                setAds([]);
                setHasSearched(false);
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-muted h-64 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : hasSearched && ads.length === 0 ? (
        <Card className="border-border/50 p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum anúncio encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente palavras-chave diferentes ou verifique suas credenciais Meta
          </p>
        </Card>
      ) : ads.length > 0 ? (
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
      ) : null}
    </div>
  );
}
