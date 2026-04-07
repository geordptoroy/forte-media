import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import { RegionSelector } from "@/components/ads/RegionSelector";
import {
  Search,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  Calendar,
  Globe,
  Play,
  Clock,
  DollarSign,
  Eye,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractNumericValue(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object") {
    const min = value.min ?? value.lower_bound ?? 0;
    const max = value.max ?? value.upper_bound ?? 0;
    return (Number(min) + Number(max)) / 2 || 0;
  }
  return 0;
}

function calculateDaysActive(startTime?: string, stopTime?: string): number {
  if (!startTime) return 0;
  try {
    const start = new Date(startTime).getTime();
    const end = stopTime ? new Date(stopTime).getTime() : Date.now();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdvancedSearch() {
  const [keywords, setKeywords] = useState("");
  const [ads, setAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filters
  const [countries, setCountries] = useState(["BR"]);
  const [adType, setAdType] = useState<"ALL" | "POLITICAL_AND_ISSUE_ADS" | "HOUSING_ADS" | "CREDIT_ADS" | "EMPLOYMENT_ADS">("ALL");
  const [adActiveStatus, setAdActiveStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [minSpend, setMinSpend] = useState("");
  const [maxSpend, setMaxSpend] = useState("");
  const [minImpressions, setMinImpressions] = useState("");
  const [maxImpressions, setMaxImpressions] = useState("");
  const [minDaysActive, setMinDaysActive] = useState("");
  const [publisherPlatforms, setPublisherPlatforms] = useState<string[]>([]);
  const [minScalingScore, setMinScalingScore] = useState("");
  const [limit, setLimit] = useState("50");

  const searchAdsQuery = trpc.meta.searchByKeywords.useQuery(
    {
      keywords,
      countries,
      adType,
      adActiveStatus,
      limit: parseInt(limit),
    },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!keywords.trim()) {
      toast.error("Digite pelo menos uma palavra-chave");
      return;
    }
    setIsSearching(true);
    try {
      const result = await searchAdsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        let filtered = result.data.data;

        // Apply client-side filters
        if (mediaType) {
          filtered = filtered.filter((ad: any) => ad.media_type === mediaType);
        }

        if (minSpend || maxSpend) {
          filtered = filtered.filter((ad: any) => {
            const spend = extractNumericValue(ad.spend);
            if (minSpend && spend < parseFloat(minSpend)) return false;
            if (maxSpend && spend > parseFloat(maxSpend)) return false;
            return true;
          });
        }

        if (minImpressions || maxImpressions) {
          filtered = filtered.filter((ad: any) => {
            const impressions = extractNumericValue(ad.impressions);
            if (minImpressions && impressions < parseFloat(minImpressions)) return false;
            if (maxImpressions && impressions > parseFloat(maxImpressions)) return false;
            return true;
          });
        }

        if (minDaysActive) {
          filtered = filtered.filter((ad: any) => {
            const daysActive = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
            return daysActive >= parseInt(minDaysActive);
          });
        }

        if (publisherPlatforms.length > 0) {
          filtered = filtered.filter((ad: any) => {
            const adPlatforms = ad.publisher_platforms || [];
            return publisherPlatforms.some(p => adPlatforms.includes(p));
          });
        }

        if (minScalingScore) {
          filtered = filtered.filter((ad: any) => {
            const score = ad.scalingScore || 0;
            return score >= parseFloat(minScalingScore);
          });
        }

        // Sort by scaling score descending
        filtered.sort((a: any, b: any) => (b.scalingScore || 0) - (a.scalingScore || 0));

        setAds(filtered);
        toast.success(`${filtered.length} anúncios encontrados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios");
      }
    } catch (error) {
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    setKeywords("");
    setCountries(["BR"]);
    setAdType("ALL");
    setAdActiveStatus("ALL");
    setMediaType(null);
    setMinSpend("");
    setMaxSpend("");
    setMinImpressions("");
    setMaxImpressions("");
    setMinDaysActive("");
    setPublisherPlatforms([]);
    setMinScalingScore("");
    setLimit("50");
    setAds([]);
  };

  const togglePlatform = (platform: string) => {
    setPublisherPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // COUNTRIES removido — substituído pelo RegionSelector com todos os países da Meta
  const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "AUDIENCE_NETWORK", "MESSENGER"];
  const MEDIA_TYPES = ["IMAGE", "VIDEO", "CAROUSEL"];
  const AD_TYPES: Array<"ALL" | "POLITICAL_AND_ISSUE_ADS" | "HOUSING_ADS" | "CREDIT_ADS" | "EMPLOYMENT_ADS"> = ["ALL", "POLITICAL_AND_ISSUE_ADS", "HOUSING_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS"];
  const AD_STATUSES: Array<"ALL" | "ACTIVE" | "INACTIVE"> = ["ALL", "ACTIVE", "INACTIVE"];

  const activeFiltersCount = [
    keywords ? 1 : 0,
    countries.length > 1 ? 1 : 0,
    adType !== "ALL" ? 1 : 0,
    adActiveStatus !== "ALL" ? 1 : 0,
    mediaType ? 1 : 0,
    minSpend || maxSpend ? 1 : 0,
    minImpressions || maxImpressions ? 1 : 0,
    minDaysActive ? 1 : 0,
    publisherPlatforms.length > 0 ? 1 : 0,
    minScalingScore ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white tracking-tight">Busca Avançada</h1>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            Filtros granulares para encontrar anúncios escalados com precisão
          </p>
        </div>

        {/* Search bar */}
        <div className="border border-white/[0.06] bg-black">
          <div className="flex gap-0 bg-white/[0.02]">
            <div className="flex-1 px-4 py-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="Palavras-chave, domínios, nomes de páginas..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-700 outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Buscar
            </button>
          </div>
        </div>

        {/* Filters panel */}
        <div className="border border-white/[0.06] bg-black">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-b border-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white/[0.08] border border-white/[0.12] text-[9px] font-black text-white">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 border-t border-white/[0.06]">
                  {/* Countries — RegionSelector com todos os países da Meta Ads Library */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Países / Regiões</p>
                    <RegionSelector
                      selected={countries}
                      onChange={setCountries}
                    />
                  </div>

                  {/* Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Status</p>
                      <select
                        value={adActiveStatus}
                        onChange={(e) => setAdActiveStatus(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                        className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.08] text-xs text-white rounded-none outline-none"
                      >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVE">Ativos</option>
                        <option value="INACTIVE">Inativos</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Tipo</p>
                      <select
                        value={adType}
                        onChange={(e) => setAdType(e.target.value as "ALL" | "POLITICAL_AND_ISSUE_ADS" | "HOUSING_ADS" | "CREDIT_ADS" | "EMPLOYMENT_ADS")}
                        className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.08] text-xs text-white rounded-none outline-none"
                      >
                        {AD_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Media Type */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Formato</p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setMediaType(null)}
                        className={cn(
                          "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all",
                          !mediaType
                            ? "bg-white text-black border-white"
                            : "border-white/[0.06] text-gray-600 hover:border-white/20"
                        )}
                      >
                        Todos
                      </button>
                      {MEDIA_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setMediaType(type)}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all",
                            mediaType === type
                              ? "bg-white text-black border-white"
                              : "border-white/[0.06] text-gray-600 hover:border-white/20"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spend range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Gasto Min</p>
                      <Input
                        type="number"
                        placeholder="$0"
                        value={minSpend}
                        onChange={(e) => setMinSpend(e.target.value)}
                        className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Gasto Max</p>
                      <Input
                        type="number"
                        placeholder="$10000"
                        value={maxSpend}
                        onChange={(e) => setMaxSpend(e.target.value)}
                        className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Impressions range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Alcance Min</p>
                      <Input
                        type="number"
                        placeholder="0"
                        value={minImpressions}
                        onChange={(e) => setMinImpressions(e.target.value)}
                        className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Alcance Max</p>
                      <Input
                        type="number"
                        placeholder="1000000"
                        value={maxImpressions}
                        onChange={(e) => setMaxImpressions(e.target.value)}
                        className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Days active */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Dias Ativos (Mín)</p>
                    <Input
                      type="number"
                      placeholder="7"
                      value={minDaysActive}
                      onChange={(e) => setMinDaysActive(e.target.value)}
                      className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                    />
                  </div>

                  {/* Platforms */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Plataformas</p>
                    <div className="flex flex-wrap gap-1">
                      {PLATFORMS.map(platform => (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(platform)}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all",
                            publisherPlatforms.includes(platform)
                              ? "bg-white text-black border-white"
                              : "border-white/[0.06] text-gray-600 hover:border-white/20"
                          )}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scaling score */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Score de Escala (Mín)</p>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={minScalingScore}
                      onChange={(e) => setMinScalingScore(e.target.value)}
                      className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                    />
                  </div>

                  {/* Limit */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Limite de Resultados</p>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.08] text-xs text-white rounded-none outline-none"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>

                  {/* Reset button */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white hover:border-white/20 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border border-white/10" />
                <div className="absolute inset-0 border border-white border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Consultando</p>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Meta Ad Library API</p>
              </div>
            </motion.div>
          )}

          {!isSearching && ads.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  {ads.length} anúncios encontrados
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.02]">
                {ads.map((ad, i) => (
                  <motion.div
                    key={ad.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-black"
                  >
                    <AdCard ad={ad} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {!isSearching && ads.length === 0 && keywords && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            >
              <Search className="w-12 h-12 text-gray-700" />
              <div>
                <p className="text-sm font-black text-white mb-1">Nenhum anúncio encontrado</p>
                <p className="text-xs text-gray-600">Tente ajustar os filtros ou usar outros termos de busca</p>
              </div>
            </motion.div>
          )}

          {!isSearching && ads.length === 0 && !keywords && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            >
              <Filter className="w-12 h-12 text-gray-700" />
              <div>
                <p className="text-sm font-black text-white mb-1">Comece sua busca</p>
                <p className="text-xs text-gray-600">Digite palavras-chave e clique em Buscar para encontrar anúncios escalados</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
