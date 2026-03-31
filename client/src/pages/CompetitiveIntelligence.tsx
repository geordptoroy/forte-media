import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Search,
  Heart,
  Eye,
  DollarSign,
  Users,
  Calendar,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CompetitiveIntelligence() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [country, setCountry] = useState("BR");
  const [isLoading, setIsLoading] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const addFavoriteMutation = trpc.ads.addFavorite.useMutation({
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Erro ao salvar favorito");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar favorito");
    },
  });

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();
  
  // Queries com enabled condicional
  const searchAdsQuery = trpc.meta.searchAds.useQuery(
    { searchTerms: [searchQuery], countries: [country] },
    { enabled: false } // Controlado manualmente
  );
  
  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    { countries: [country], minSpend: 1000 },
    { enabled: false } // Controlado manualmente
  );

  const handleSearch = async () => {
    if (!credentialsStatus.data?.isValid) {
      toast.error("Configure suas credenciais Meta primeiro");
      setLocation("/settings");
      return;
    }

    if (!searchQuery.trim()) {
      toast.error("Insira um termo de busca");
      return;
    }

    try {
      const result = await searchAdsQuery.refetch();
      if (result.data?.ads) {
        setAds(result.data.ads);
        toast.success(`${result.data.ads.length} anúncios encontrados`);
      } else {
        toast.info("Nenhum anúncio encontrado");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao buscar anúncios"
      );
    }
  };

  const handleSearchScaled = async () => {
    if (!credentialsStatus.data?.isValid) {
      toast.error("Configure suas credenciais Meta primeiro");
      setLocation("/settings");
      return;
    }

    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.ads) {
        setAds(result.data.ads);
        toast.success(`${result.data.ads.length} anúncios escalados encontrados`);
      } else {
        toast.info("Nenhum anúncio escalado encontrado");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao buscar anúncios escalados"
      );
    }
  };

  const toggleFavorite = (adId: string, ad?: any) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(adId)) {
      newFavorites.delete(adId);
      toast.success("Removido dos favoritos");
    } else {
      newFavorites.add(adId);
      toast.success("Adicionado aos favoritos");
      // Persistir no banco de dados via tRPC
      if (ad) {
        addFavoriteMutation.mutate({
          adId: adId,
          pageId: ad.page_id || adId,
          pageName: ad.page_name || ad.name,
          adBody: ad.body || ad.ad_creative_body,
          adSnapshotUrl: ad.ad_snapshot_url,
          spend: typeof ad.spend === 'number' ? ad.spend : undefined,
          impressions: typeof ad.impressions === 'number' ? ad.impressions : undefined,
          currency: ad.currency,
        });
      }
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Inteligência Competitiva
              </h1>
              <p className="text-xs text-muted-foreground">
                Analise anúncios competitivos em tempo real
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Search Card */}
        <Card className="border-border/50 p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Buscar Anúncios Competitivos
          </h2>

          {!credentialsStatus.data?.isValid && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Credenciais não configuradas
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                  Configure suas credenciais Meta em Configurações para começar
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Termo de Busca
                </label>
                <Input
                  placeholder="Ex: iPhone, Nike, Viagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  País
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="MX">México</option>
                  <option value="AR">Argentina</option>
                  <option value="PT">Portugal</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSearch}
                disabled={isLoading || !credentialsStatus.data?.isValid}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" strokeWidth={2} />
                    Buscar
                  </>
                )}
              </Button>
              <Button
                onClick={handleSearchScaled}
                disabled={isLoading || !credentialsStatus.data?.isValid}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                <TrendingUp className="w-4 h-4 mr-2" strokeWidth={2} />
                Anúncios Escalados
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {ads.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {ads.length} Anúncios Encontrados
            </h2>

            <div className="grid gap-4">
              {ads.map((ad, idx) => (
                <Card
                  key={idx}
                  className="border-border/50 p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {ad.name || "Anúncio"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {ad.body || "Sem descrição disponível"}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Gasto</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.spend ? `$${ad.spend}` : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Impressões</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.impressions || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Público</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.targetAudience || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Período</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.startDate || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(ad.id || idx.toString(), ad)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.has(ad.id || idx.toString())
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {ads.length === 0 && !isLoading && (
          <Card className="border-border/50 p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum anúncio encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Use a busca acima para encontrar anúncios competitivos
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
