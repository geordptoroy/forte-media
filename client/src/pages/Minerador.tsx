import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCardV3 } from "@/components/ads/AdCardV3";
import { Input } from "@/components/ui/input";
import { Loader2, Search, RefreshCcw, Pickaxe, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function Minerador() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [minScaleScore, setMinScaleScore] = useState(0);
  const [maxScaleScore, setMaxScaleScore] = useState(100);
  const [nicheFilter, setNicheFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const niches = ["Infoproduto", "Nutra", "SaaS", "E-commerce", "Imobiliário"];

  const searchWithFiltersQuery = trpc.ads.searchWithFilters.useQuery(
    {
      keywords: searchKeywords || undefined,
      niche: nicheFilter || undefined,
      minScaleScore,
      maxScaleScore,
      limit: 100,
    },
    { enabled: false }
  );

  const performSearch = useCallback(async () => {
    if (!searchKeywords.trim()) {
      toast.error("Digite uma palavra-chave para buscar");
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchWithFiltersQuery.refetch();
      if (result.data?.success && result.data?.ads) {
        setAds(result.data.ads);
        toast.success(`${result.data.ads.length} anúncios encontrados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios");
      }
    } catch (error) {
      toast.error("Erro na busca de anúncios");
    } finally {
      setIsLoading(false);
    }
  }, [searchKeywords, searchWithFiltersQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const resetFilters = () => {
    setSearchKeywords("");
    setMinScaleScore(0);
    setMaxScaleScore(100);
    setNicheFilter("");
    setAds([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pickaxe className="w-5 h-5 text-orange-400" />
              <h1 className="text-lg font-black text-white tracking-tight">Minerador</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Ferramenta avançada para minerar anúncios com filtros de escala, nicho e performance.
            </p>
          </div>
          {ads.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Encontrados</p>
                <p className="text-sm font-black text-white">{ads.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="border border-white/[0.06] bg-black">
          <div className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-white/[0.06]">
              <Search className="absolute left-4 w-4 h-4 text-gray-600" />
              <Input
                placeholder="Buscar por palavra-chave (ex: emagrecimento, curso, saas...)"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-12 bg-transparent border-none pl-12 text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none"
              />
            </div>
            <div className="flex">
              <button
                onClick={performSearch}
                disabled={isLoading || !searchKeywords.trim()}
                className="flex-1 md:flex-none px-6 h-12 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Minerar"}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "w-12 h-12 border-l border-white/[0.06] transition-all flex items-center justify-center",
                  showFilters
                    ? "bg-white/[0.1] text-white"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="border-t border-white/[0.06] p-4 space-y-4">
              {/* Escala de Score */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  Score de Escala: {minScaleScore} - {maxScaleScore}
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minScaleScore}
                      onChange={(e) => setMinScaleScore(Math.min(parseInt(e.target.value), maxScaleScore))}
                      className="w-full"
                    />
                    <p className="text-[8px] text-gray-600 mt-1">Mínimo</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={maxScaleScore}
                      onChange={(e) => setMaxScaleScore(Math.max(parseInt(e.target.value), minScaleScore))}
                      className="w-full"
                    />
                    <p className="text-[8px] text-gray-600 mt-1">Máximo</p>
                  </div>
                </div>
              </div>

              {/* Nicho */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Nicho</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setNicheFilter("")}
                    className={cn(
                      "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border transition-all",
                      nicheFilter === ""
                        ? "bg-white text-black border-white"
                        : "bg-transparent border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2]"
                    )}
                  >
                    Todos
                  </button>
                  {niches.map((niche) => (
                    <button
                      key={niche}
                      onClick={() => setNicheFilter(niche)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border transition-all",
                        nicheFilter === niche
                          ? "bg-white text-black border-white"
                          : "bg-transparent border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2]"
                      )}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded border border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2] transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {ads.length > 0 ? (
              ads.map((ad, idx) => (
                <motion.div
                  key={ad.id || ad.adId || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdCardV3 ad={ad} showIntelligence={true} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12">
                <EmptyState
                  icon={Pickaxe}
                  title={isLoading ? "Minerando..." : "Comece a minerar"}
                  description={
                    isLoading
                      ? "Buscando anúncios com seus critérios..."
                      : "Digite uma palavra-chave e ajuste os filtros para encontrar os melhores anúncios para clonar."
                  }
                  actionLabel="Minerar Agora"
                  onAction={performSearch}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
