import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import { RegionSelector } from "@/components/ads/RegionSelector";
import {
  Loader2,
  Trophy,
  Clock,
  RefreshCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";

const CACHE_KEY = "escalados_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface CacheEntry {
  ads: any[];
  timestamp: number;
  countries: string[];
}

export default function Escalados() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countries, setCountries] = useState(["BR"]);

  const getTopScaledAdsQuery = trpc.meta.getTopScaledAds.useQuery(
    {
      countries,
      adActiveStatus: "ACTIVE",
      limit: 50,
    },
    { enabled: false }
  );

  const loadAds = useCallback(async (forceRefresh = false) => {
    const currentFiltersHash = JSON.stringify({ countries });

    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const entry: CacheEntry & { filtersHash?: string } = JSON.parse(cached);
          const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
          const isSameFilters = entry.filtersHash === currentFiltersHash;
          
          if (!isExpired && isSameFilters) {
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

        try {
          const entry: CacheEntry & { filtersHash: string } = {
            ads: newAds,
            timestamp: now.getTime(),
            countries,
            filtersHash: currentFiltersHash
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
  }, [countries, getTopScaledAdsQuery]);

  useEffect(() => {
    loadAds();
  }, [countries]);

  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadAds(true);
      }
    };
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [loadAds]);

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

        {/* Region Selector Bar */}
        <div className="border border-white/[0.06] bg-black p-4">
          <div className="flex items-start gap-3">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1 whitespace-nowrap">País / Região</span>
            <div className="flex-1">
              <RegionSelector selected={countries} onChange={setCountries} />
            </div>
            <button
              onClick={() => loadAds(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
              Atualizar
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {ads.length > 0 ? (
              ads.map((ad, idx) => (
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
                  title="Nenhum anúncio escalado"
                  description={
                    isLoading
                      ? "Buscando campeões na Meta API..."
                      : "Tente mudar a região para encontrar mais resultados."
                  }
                  actionLabel="Tentar Novamente"
                  onAction={() => loadAds(true)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
