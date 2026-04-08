import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import { RegionSelector } from "@/components/ads/RegionSelector";
import {
  Pickaxe,
  Loader2,
  Search,
  RefreshCcw,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "AUDIENCE_NETWORK", "MESSENGER"];
const MEDIA_TYPES = ["IMAGE", "VIDEO", "CAROUSEL"];
const SCORE_OPTIONS = [
  { value: 0, label: "0+", description: "Todos" },
  { value: 40, label: "40+", description: "Moderados+" },
  { value: 70, label: "70+", description: "Escalados" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [keywords, setKeywords] = useState("");
  const [ads, setAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minScore, setMinScore] = useState(0);

  // Filtros
  const [countries, setCountries] = useState(["BR"]);
  const [adActiveStatus, setAdActiveStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [minDaysActive, setMinDaysActive] = useState("");
  const [publisherPlatforms, setPublisherPlatforms] = useState<string[]>([]);
  const [limit, setLimit] = useState("50");

  // Query unificada que agora suporta todos os filtros no backend
  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    {
      countries,
      searchTerms: keywords || undefined,
      adActiveStatus,
      limit: parseInt(limit),
      mediaType: mediaType || undefined,
      publisherPlatforms: publisherPlatforms.length > 0 ? publisherPlatforms : undefined,
    },
    { enabled: false }
  );

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        let results = result.data.data;

        // Filtro client-side adicional para dias ativos (não suportado nativamente pela API Meta)
        if (minDaysActive) {
          results = results.filter((ad: any) => {
            const days = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
            return days >= parseInt(minDaysActive);
          });
        }

        setAds(results);
        toast.success(`${results.length} anúncios minerados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsSearching(false);
    }
  };

  // Filtragem e ordenação derivativa (memoizada para performance)
  const displayedAds = useMemo(() => {
    let filtered = [...ads];
    
    // Filtrar por score mínimo se selecionado
    if (minScore > 0) {
      filtered = filtered.filter(ad => (ad.scalingScore || 0) >= minScore);
    }
    
    // A ordenação já vem correta do backend, mas garantimos aqui também
    return filtered.sort((a, b) => {
      const scoreA = a.scalingScore || 0;
      const scoreB = b.scalingScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [ads, minScore]);

  // Busca automática ao mudar país
  useEffect(() => {
    handleSearch();
  }, [countries]);

  const handleResetFilters = () => {
    setKeywords("");
    setAdActiveStatus("ALL");
    setMediaType(null);
    setMinDaysActive("");
    setPublisherPlatforms([]);
    setLimit("50");
    setMinScore(0);
  };

  const togglePlatform = (platform: string) => {
    setPublisherPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const activeFiltersCount = [
    keywords ? 1 : 0,
    countries.length > 1 ? 1 : 0,
    adActiveStatus !== "ALL" ? 1 : 0,
    mediaType ? 1 : 0,
    minDaysActive ? 1 : 0,
    publisherPlatforms.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Stats baseadas nos anúncios carregados
  const scaledCount = ads.filter(ad => (ad.scalingScore || 0) >= 61).length;
  const moderateCount = ads.filter(ad => (ad.scalingScore || 0) >= 31 && (ad.scalingScore || 0) < 61).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pickaxe className="w-5 h-5 text-white" />
              <h1 className="text-lg font-black text-white tracking-tight">Minerador</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Anúncios com maior investimento e tração detectados pela Meta Ad Library API v21.0
            </p>
          </div>

          {/* Stats row */}
          {ads.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-white">{ads.length}</p>
              </div>
              <div className="px-3 py-2 border border-green-500/20 bg-green-500/[0.04]">
                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Escalados</p>
                <p className="text-sm font-black text-green-500">{scaledCount}</p>
              </div>
              <div className="px-3 py-2 border border-yellow-500/20 bg-yellow-500/[0.04]">
                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Validação</p>
                <p className="text-sm font-black text-yellow-500">{moderateCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="border border-white/[0.06] bg-black">
          {/* Main search row */}
          <div className="flex flex-col md:flex-row gap-0">
            {/* Search input */}
            <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-white/[0.06]">
              <Search className="absolute left-4 w-4 h-4 text-gray-600" />
              <Input
                placeholder="Buscar nicho (ex: cosméticos, dropshipping, suplementos...)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 bg-transparent border-none pl-12 text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none"
              />
            </div>

            {/* Score filter */}
            <div className="flex items-center px-4 gap-2 border-b md:border-b-0 md:border-r border-white/[0.06] h-12">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">Score</span>
              <div className="flex gap-0.5">
                {SCORE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setMinScore(s.value)}
                    title={s.description}
                    className={cn(
                      "w-9 h-9 text-[10px] font-black border transition-all",
                      minScore === s.value
                        ? "bg-white border-white text-black"
                        : "bg-transparent border-white/[0.06] text-gray-600 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex-1 md:flex-none px-6 h-12 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Minerar"}
              </button>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-12 h-12 border-l border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center"
              >
                <RefreshCcw className={cn("w-3.5 h-3.5", isSearching && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Country selector row */}
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1 whitespace-nowrap">País / Região</span>
              <div className="flex-1">
                <RegionSelector selected={countries} onChange={setCountries} />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <div className="border border-white/[0.06] bg-black">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Filtros Avançados</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white/[0.08] border border-white/[0.12] text-[9px] font-black text-white">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {filtersOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
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
                  {/* Status e Formato */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Status do Anúncio</p>
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
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Dias Ativos (Mín)</p>
                      <Input
                        type="number"
                        placeholder="Ex: 7"
                        value={minDaysActive}
                        onChange={(e) => setMinDaysActive(e.target.value)}
                        className="h-9 bg-white/[0.02] border-white/[0.08] rounded-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Formato de mídia */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Formato de Mídia</p>
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

                  {/* Plataformas */}
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

                  {/* Limite de resultados */}
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

                  {/* Reset */}
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

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {displayedAds.length > 0 ? (
              displayedAds.map((ad, idx) => (
                <motion.div
                  key={ad.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdCard ad={ad} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12">
                <EmptyState
                  icon={Search}
                  title="Nenhum anúncio encontrado"
                  description={
                    isSearching
                      ? "Minerando anúncios na Meta API..."
                      : "Tente ajustar seus filtros ou termos de busca para encontrar mais resultados."
                  }
                  actionLabel={activeFiltersCount > 0 ? "Limpar Filtros" : "Tentar Novamente"}
                  onAction={activeFiltersCount > 0 ? handleResetFilters : handleSearch}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
