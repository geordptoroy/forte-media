import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { CredentialsWarning } from "@/components/CredentialsWarning";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import {
  TrendingUp,
  Search,
  Heart,
  Eye,
  DollarSign,
  Calendar,
  Loader2,
  Filter,
  Globe,
  Zap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdItem = any;

export default function CompetitiveIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [country, setCountry] = useState("BR");
  const [ads, setAds] = useState<AdItem[]>([]);
  // ads is typed as any[] for flexibility with Meta API response shape
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [mode, setMode] = useState<"search" | "scaled">("search");

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const addFavoriteMutation = trpc.ads.addFavorite.useMutation({
    onSuccess: (data) => {
      if (!data.success) {
        toast.error("Erro ao salvar favorito");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar favorito");
    },
  });

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
      return;
    }
    if (!searchQuery.trim()) {
      toast.error("Insira um termo de busca");
      return;
    }
    setIsSearching(true);
    setMode("search");
    try {
      const result = await searchAdsQuery.refetch();
      if (result.data?.ads) {
        setAds(result.data.ads as AdItem[]);
        toast.success(`${result.data.ads.length} anuncios encontrados`);
      } else {
        toast.info("Nenhum anuncio encontrado");
        setAds([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao buscar anuncios");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchScaled = async () => {
    if (!credentialsStatus.data?.hasCredentials) {
      toast.error("Configure suas credenciais Meta primeiro");
      return;
    }
    setIsSearching(true);
    setMode("scaled");
    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.ads) {
        setAds(result.data.ads as AdItem[]);
        toast.success(`${result.data.ads.length} anuncios escalados encontrados`);
      } else {
        toast.info("Nenhum anuncio escalado encontrado");
        setAds([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao buscar anuncios escalados"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFavorite = (adId: string, ad?: AdItem) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(adId)) {
      newFavorites.delete(adId);
      toast.success("Removido dos favoritos");
    } else {
      newFavorites.add(adId);
      toast.success("Adicionado aos favoritos");
      if (ad) {
        addFavoriteMutation.mutate({
          adId,
          pageId: (ad.page_id as string) || adId,
          pageName: (ad.page_name as string) || (ad.name as string),
          adSnapshotUrl: ad.ad_snapshot_url as string | undefined,
          adDeliveryStartTime: ad.ad_delivery_start_time
            ? new Date(ad.ad_delivery_start_time as string)
            : undefined,
          adDeliveryStopTime: ad.ad_delivery_stop_time
            ? new Date(ad.ad_delivery_stop_time as string)
            : undefined,
          publisherPlatforms: ad.publisher_platforms as string[] | undefined,
          adCreativeBodies:
            (ad.ad_creative_bodies as string[]) ||
            (ad.body ? [ad.body as string] : []),
          adCreativeLinkTitles: ad.ad_creative_link_titles as string[] | undefined,
          adCreativeLinkDescriptions: ad.ad_creative_link_descriptions as string[] | undefined,
          currency: ad.currency as string | undefined,
          spend: ad.spend as { lowerBound?: number; upperBound?: number } | undefined,
          impressions: ad.impressions as { lowerBound?: number; upperBound?: number } | undefined,
        });
      }
    }
    setFavorites(newFavorites);
  };

  const countries = [
    { value: "BR", label: "Brasil" },
    { value: "US", label: "EUA" },
    { value: "PT", label: "Portugal" },
    { value: "MX", label: "Mexico" },
    { value: "AR", label: "Argentina" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Inteligencia Competitiva"
          subtitle="Analise anuncios dos seus concorrentes e descubra o que esta escalando."
        />

        {/* Aviso de credenciais */}
        {!credentialsStatus.isLoading && !credentialsStatus.data?.hasCredentials && (
          <CredentialsWarning message="Conecte sua Meta API para buscar anuncios competitivos e analisar o mercado." />
        )}

        {/* Search Panel */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Pesquisa
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por marca, produto ou palavra-chave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="input-premium"
              />
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex gap-1">
                {countries.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCountry(c.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      country === c.value
                        ? "bg-white text-black"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {c.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={
                  isSearching ||
                  !credentialsStatus.data?.hasCredentials ||
                  !searchQuery.trim()
                }
                className="btn-premium"
              >
                {isSearching && mode === "search" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
              <Button
                onClick={handleSearchScaled}
                disabled={isSearching || !credentialsStatus.data?.hasCredentials}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                {isSearching && mode === "scaled" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Escalados
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        )}

        {/* Empty State */}
        {!isSearching && ads.length === 0 && (
          <EmptyState
            icon={TrendingUp}
            title="Nenhum resultado"
            description="Busque por palavras-chave ou clique em Escalados para ver os anuncios com maior investimento."
          />
        )}

        {/* Results */}
        {!isSearching && ads.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-bold">{ads.length} anuncios encontrados</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad, i) => {
                const adId = (ad.id as string) || String(i);
                const isFavorited = favorites.has(adId);

                return (
                  <Card
                    key={adId}
                    className="card-premium-hover bg-white/[0.02] border-white/5 overflow-hidden group"
                  >
                    {/* Snapshot */}
                    {ad.ad_snapshot_url && (
                      <div className="aspect-video bg-white/5 overflow-hidden">
                        <img
                          src={ad.ad_snapshot_url as string}
                          alt={(ad.page_name as string) || "Ad"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-sm font-bold text-white truncate">
                          {(ad.page_name as string) || "Pagina desconhecida"}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(adId, ad)}
                          className={`shrink-0 transition-colors ${
                            isFavorited
                              ? "text-red-500"
                              : "text-gray-600 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className="w-4 h-4"
                            fill={isFavorited ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      {/* Body */}
                      {(ad.ad_creative_bodies as string[])?.[0] && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                          {(ad.ad_creative_bodies as string[])[0]}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {(ad.spend as { lowerBound?: number })?.lowerBound && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              ${(ad.spend as { lowerBound: number }).lowerBound}+
                            </span>
                          </div>
                        )}
                        {(ad.impressions as { lowerBound?: number })?.lowerBound && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Eye className="w-3 h-3" />
                            <span>
                              {(
                                (ad.impressions as { lowerBound: number }).lowerBound / 1000
                              ).toFixed(0)}
                              k+
                            </span>
                          </div>
                        )}
                        {ad.ad_delivery_start_time && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(
                                ad.ad_delivery_start_time as string
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {ad.ad_snapshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full border-white/10 hover:bg-white/5 text-xs"
                        >
                          <a
                            href={ad.ad_snapshot_url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver Anuncio
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
