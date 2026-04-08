import { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SCORE_OPTIONS = [
  { value: 0, label: "0+", description: "Todos" },
  { value: 40, label: "40+", description: "Moderados+" },
  { value: 70, label: "70+", description: "Escalados" },
];

export default function Dashboard() {
  const [keywords, setKeywords] = useState("");
  const [rawAds, setRawAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [countries, setCountries] = useState(["BR"]);

  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    {
      countries,
      searchTerms: keywords || undefined,
      adActiveStatus: "ALL",
      limit: 50,
    },
    { enabled: false }
  );

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        setRawAds(result.data.data);
        toast.success(`${result.data.data.length} anúncios minerados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsSearching(false);
    }
  }, [searchScaledAdsQuery]);

  const displayedAds = useMemo(() => {
    let filtered = [...rawAds];
    if (minScore > 0) {
      filtered = filtered.filter(ad => (ad.scalingScore || 0) >= minScore);
    }
    return filtered.sort((a, b) => {
      const scoreA = a.scalingScore || 0;
      const scoreB = b.scalingScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [rawAds, minScore]);

  useEffect(() => {
    handleSearch();
  }, [countries]);

  const scaledCount = rawAds.filter(ad => (ad.scalingScore || 0) >= 61).length;
  const moderateCount = rawAds.filter(ad => (ad.scalingScore || 0) >= 31 && (ad.scalingScore || 0) < 61).length;

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
          {rawAds.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-white">{rawAds.length}</p>
              </div>
              <div className="px-3 py-2 border border-green-500/20 bg-green-500/[0.04]">
                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Escalados</p>
                <p className="text-sm font-black text-green-500">{scaledCount}</p>
              </div>
              <div className="px-3 py-2 border border-yellow-500/20 bg-yellow-500/[0.04]">
                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Validação</p>
                <p className="text-sm font-black text-yellow-500">{moderateCount}</p>
              </div>
              {minScore > 0 && (
                <div className="px-3 py-2 border border-white/20 bg-white/[0.04]">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Exibindo</p>
                  <p className="text-sm font-black text-white">{displayedAds.length}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="border border-white/[0.06] bg-black">
          <div className="flex flex-col md:flex-row gap-0">
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

          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1 whitespace-nowrap">País / Região</span>
              <div className="flex-1">
                <RegionSelector selected={countries} onChange={setCountries} />
              </div>
            </div>
          </div>
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
                  title={minScore > 0 ? "Nenhum anúncio com este score" : "Nenhum anúncio minerado"}
                  description={
                    isSearching
                      ? "Minerando anúncios na Meta API..."
                      : minScore > 0
                      ? "Tente diminuir o filtro de score para ver mais resultados."
                      : "Digite um nicho acima e clique em Minerar para começar."
                  }
                  actionLabel={minScore > 0 ? "Remover Filtro de Score" : "Tentar Novamente"}
                  onAction={() => (minScore > 0 ? setMinScore(0) : handleSearch())}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
