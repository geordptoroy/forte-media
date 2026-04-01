import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Search,
  Heart,
  Eye,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  Filter,
  Globe
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function CompetitiveIntelligence() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [country, setCountry] = useState("BR");
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
  
  const searchAdsQuery = trpc.meta.searchAds.useQuery(
    { searchTerms: [searchQuery], countries: [country] },
    { enabled: false }
  );
  
  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    { countries: [country], minSpend: 1000 },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!credentialsStatus.data?.hasCredentials) {
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
      toast.error(error instanceof Error ? error.message : "Erro ao buscar anúncios");
    }
  };

  const handleSearchScaled = async () => {
    if (!credentialsStatus.data?.hasCredentials) {
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
      toast.error(error instanceof Error ? error.message : "Erro ao buscar anúncios escalados");
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

  const isLoading = searchAdsQuery.isFetching || searchScaledAdsQuery.isFetching;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Inteligência Competitiva</h1>
          <p className="text-gray-500 font-medium">Analise estratégias de concorrentes e descubra anúncios de alta performance.</p>
        </div>

        {/* Search Controls */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
          <div className="flex items-center gap-2 mb-8">
            <Filter className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Filtros de Busca</h2>
          </div>

          {!credentialsStatus.data?.hasCredentials && (
            <div className="mb-8 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Credenciais Ausentes</p>
                <p className="text-xs text-gray-400 mt-1">Conecte sua conta Meta em Configurações para habilitar a busca em tempo real.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Termo ou Palavra-chave</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Ex: Marketing Digital, SaaS, E-commerce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  disabled={isLoading}
                  className="input-premium pl-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Região</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isLoading}
                  className="input-premium w-full pl-12 appearance-none cursor-pointer"
                >
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="PT">Portugal</option>
                  <option value="MX">México</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <Button
              onClick={handleSearch}
              disabled={isLoading || !credentialsStatus.data?.hasCredentials}
              className="btn-premium px-8 min-w-[140px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscar Agora
                </span>
              )}
            </Button>
            
            <Button
              onClick={handleSearchScaled}
              disabled={isLoading || !credentialsStatus.data?.hasCredentials}
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest px-6"
            >
              <TrendingUp className="w-4 h-4 mr-2 text-yellow-500" />
              Anúncios Escalados
            </Button>
          </div>
        </Card>

        {/* Results Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
              {ads.length > 0 ? `${ads.length} Resultados encontrados` : "Resultados da Busca"}
            </h2>
          </div>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {ads.map((ad, idx) => (
                <Card key={idx} className="card-premium bg-white/[0.02] border-white/5 p-8 group hover:border-white/20 transition-all">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Ad Preview Placeholder */}
                    <div className="w-full md:w-64 h-80 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                      {ad.ad_snapshot_url ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase">Preview</div>
                      ) : (
                        <Eye className="w-8 h-8 text-gray-800" />
                      )}
                      <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10">
                        <p className="text-[10px] font-bold text-white uppercase tracking-tighter truncate">{ad.page_name || "Meta Ad"}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded uppercase tracking-widest">Ativo</span>
                            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase tracking-widest">{ad.currency || "USD"}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white group-hover:text-primary-foreground transition-colors">
                            {ad.page_name || "Anúncio Competitivo"}
                          </h3>
                        </div>
                        
                        <Button
                          variant="ghost"
                          onClick={() => toggleFavorite(ad.id || idx.toString(), ad)}
                          className={cn(
                            "p-2 rounded-full transition-all",
                            favorites.has(ad.id || idx.toString()) ? "bg-red-500/10 text-red-500" : "text-gray-600 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <Heart className={cn("w-6 h-6", favorites.has(ad.id || idx.toString()) && "fill-current")} />
                        </Button>
                      </div>

                      <p className="text-sm text-gray-400 leading-relaxed mb-8 line-clamp-3 italic">
                        "{ad.body || "Sem descrição disponível para este criativo."}"
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3" /> Gasto
                          </p>
                          <p className="text-sm font-bold text-white">{ad.spend ? `$${ad.spend}` : "Sob Consulta"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Alcance
                          </p>
                          <p className="text-sm font-bold text-white">{ad.impressions || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3" /> Escala
                          </p>
                          <p className="text-sm font-bold text-white">Alta</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" /> Lançado
                          </p>
                          <p className="text-sm font-bold text-white">{ad.startDate || "Recentemente"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : !isLoading && (
            <Card className="card-premium bg-white/[0.01] border-white/5 p-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Search className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pronto para buscar?</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Utilize os filtros acima para encontrar anúncios competitivos ou clique em "Anúncios Escalados" para ver as tendências.
              </p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
