import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import { RegionSelector } from "@/components/ads/RegionSelector";
import { Input } from "@/components/ui/input";
import { Loader2, Trophy, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";

export default function Escalados() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState(["BR"]);
  const [wordFilter, setWordFilter] = useState("");

  const query = trpc.meta.getEscaladosAds.useQuery(
    {
      countries,
      adActiveStatus: "ACTIVE",
      searchTerms: wordFilter.trim() || undefined,
      limit: 50,
    },
    { enabled: false }
  );

  const loadAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await query.refetch();
      if (result.data?.success && result.data?.data) {
        setAds(result.data.data);
        toast.success(`${result.data.data.length} anúncios carregados`);
      } else {
        toast.error(result.data?.error || "Erro ao carregar anúncios");
      }
    } catch {
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h1 className="text-lg font-black text-white tracking-tight">Escalados</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Anúncios ativos buscados diretamente na Meta Ad Library
            </p>
          </div>
          {ads.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-white">{ads.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="border border-white/[0.06] bg-black">
          <div className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-white/[0.06]">
              <Search className="absolute left-4 w-4 h-4 text-gray-600" />
              <Input
                placeholder="Filtrar por palavra-chave (ex: emagrecimento, curso, produto...)"
                value={wordFilter}
                onChange={(e) => setWordFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAds()}
                className="h-12 bg-transparent border-none pl-12 text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none"
              />
            </div>
            <div className="flex">
              <button
                onClick={loadAds}
                disabled={isLoading}
                className="flex-1 md:flex-none px-6 h-12 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
              </button>
              <button
                onClick={loadAds}
                disabled={isLoading}
                className="w-12 h-12 border-l border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Region Selector */}
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1 whitespace-nowrap">
                País / Região
              </span>
              <div className="flex-1">
                <RegionSelector selected={countries} onChange={setCountries} />
              </div>
            </div>
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
                  title="Nenhum anúncio encontrado"
                  description={
                    isLoading
                      ? "Buscando anúncios na Meta Ad Library..."
                      : "Digite uma palavra-chave e clique em Buscar, ou clique em Buscar para ver anúncios ativos."
                  }
                  actionLabel="Buscar Anúncios"
                  onAction={loadAds}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
