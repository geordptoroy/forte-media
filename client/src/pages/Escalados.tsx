import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
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
  RotateCcw,
  Trophy,
  Clock,
  RefreshCcw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDateMinForPeriod(period: string): string | undefined {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split("T")[0];
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split("T")[0];
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split("T")[0];
    }
    case "3months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d.toISOString().split("T")[0];
    }
    case "6months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d.toISOString().split("T")[0];
    }
    case "9months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 9);
      return d.toISOString().split("T")[0];
    }
    case "1year+": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split("T")[0];
    }
    default:
      return undefined;
  }
}

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "3months", label: "3 Meses" },
  { value: "6months", label: "6 Meses" },
  { value: "9months", label: "9 Meses" },
  { value: "1year+", label: "+1 Ano" },
];

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "AUDIENCE_NETWORK", "MESSENGER"];
const MEDIA_TYPES = ["IMAGE", "VIDEO", "CAROUSEL"];
const CACHE_KEY = "escalados_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface CacheEntry {
  ads: any[];
  timestamp: number;
  period: string;
  countries: string[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Escalados() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filtros
  const [period, setPeriod] = useState("month");
  const [countries, setCountries] = useState(["BR"]);
  const [keywords, setKeywords] = useState("");
  const [adActiveStatus, setAdActiveStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [publisherPlatforms, setPublisherPlatforms] = useState<string[]>([]);

  const getTopScaledAdsQuery = trpc.meta.getTopScaledAds.useQuery(
    {
      countries,
      searchTerms: keywords || undefined,
      adActiveStatus,
      adDeliveryDateMin: getDateMinForPeriod(period),
      limit: 50,
      mediaType: mediaType || undefined,
      publisherPlatforms: publisherPlatforms.length > 0 ? publisherPlatforms : undefined,
    },
    { enabled: false }
  );

  const loadAds = useCallback(async (forceRefresh = false) => {
    // Verificar cache
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
          const isSamePeriod = entry.period === period;
          const isSameCountries = JSON.stringify(entry.countries) === JSON.stringify(countries);
          if (!isExpired && isSamePeriod && isSameCountries) {
            setAds(entry.ads);
            setLastUpdated(new Date(entry.timestamp));
            return;
          }
        }
      } catch {
        // Ignorar erros de cache
      }
    }

    setIsLoading(true);
    try {
      const result = await getTopScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        const newAds = result.data.data;
        setAds(newAds);
        const now = new Date();
        setLastUpdated(now);

        // Salvar no cache
        try {
          const entry: CacheEntry = {
            ads: newAds,
            timestamp: now.getTime(),
            period,
            countries,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
        } catch {
          // Ignorar erros de cache
        }

        toast.success(`${newAds.length} anúncios escalados carregados`);
      } else {
        toast.error(result.data?.error || "Erro ao carregar anúncios escalados");
      }
    } catch {
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsLoading(false);
    }
  }, [period, countries, keywords, adActiveStatus, mediaType, publisherPlatforms]);

  // Carregar ao montar e quando período/países mudam
  useEffect(() => {
    loadAds();
  }, [period, countries]);

  // Verificar se é meia-noite para atualização automática
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadAds(true);
      }
    };

    const interval = setInterval(checkMidnight, 60000); // Verificar a cada minuto
    return () => clearInterval(interval);
  }, [loadAds]);

  const handleSearch = () => {
    loadAds(true);
  };

  const handleResetFilters = () => {
    setPeriod("month");
    setCountries(["BR"]);
    setKeywords("");
    setAdActiveStatus("ACTIVE");
    setMediaType(null);
    setPublisherPlatforms([]);
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
    adActiveStatus !== "ACTIVE" ? 1 : 0,
    mediaType ? 1 : 0,
    publisherPlatforms.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const scaledCount = ads.filter(ad => (ad.scalingScore || 0) >= 61).length;
  const moderateCount = ads.filter(ad => (ad.scalingScore || 0) >= 31 && (ad.scalingScore || 0) < 61).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h1 className="text-lg font-black text-white tracking-tight">Escalados</h1>
              <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-black text-yellow-400 uppercase tracking-widest">
                Campeões
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              50 anúncios com maior escala detectados pela Meta Ad Library — atualizado diariamente às 00:00
            </p>
            {lastUpdated && (
              <p className="text-[9px] text-gray-700 font-mono mt-1 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Última atualização: {lastUpdated.toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          {/* Stats */}
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

        {/* Period Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mr-2">Período:</span>
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all",
                  period === opt.value
                    ? "bg-white text-black border-white"
                    : "border-white/[0.06] text-gray-600 hover:border-white/20 hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => loadAds(true)}
              disabled={isLoading}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCcw className={cn("w-3 h-3", isLoading && "animate-spin")} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="border border-white/[0.06] bg-black">
          <div className="flex gap-0 bg-white/[0.02]">
            <div className="flex-1 px-4 py-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="Filtrar por palavras-chave, nicho, nome de página..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-700 outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Buscar
            </button>
          </div>
        </div>

        {/* Filters panel */}
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
                  {/* Países */}
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Países / Regiões</p>
                    <RegionSelector selected={countries} onChange={setCountries} />
                  </div>

                  {/* Status e Formato */}
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

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border border-white/10" />
                <div className="absolute inset-0 border border-yellow-400 border-t-transparent animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Carregando Campeões</p>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Meta Ad Library API v21.0</p>
              </div>
            </motion.div>
          ) : ads.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  {ads.length} anúncios escalados — {PERIOD_OPTIONS.find(p => p.value === period)?.label}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.04]">
                {ads.map((ad, i) => (
                  <motion.div
                    key={ad.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                    className="bg-black"
                  >
                    <AdCard ad={ad} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-4 text-center"
            >
              <Trophy className="w-12 h-12 text-gray-700" />
              <div>
                <p className="text-sm font-black text-white mb-1">Nenhum anúncio escalado encontrado</p>
                <p className="text-xs text-gray-600">Tente ajustar o período ou os filtros de busca</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
