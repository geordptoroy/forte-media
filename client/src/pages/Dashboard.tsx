import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import {
  Zap,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  Globe,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [searchTerms, setSearchTerms] = useState("");
  const [country, setCountry] = useState("BR");
  const [ads, setAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [minScore, setMinScore] = useState(0);

  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    { countries: [country], searchTerms },
    { enabled: false }
  );

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        setAds(result.data.data);
        toast.success(`${result.data.data.length} anúncios escalados minerados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios escalados");
      }
    } catch (error) {
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [country]);

  const filteredAds = ads.filter(ad => (ad.scalingScore || 0) >= minScore);

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                <span>Escala & Mercado</span>
              </div>
            }
            subtitle="Anúncios com maior investimento e tração nas últimas 24h."
          />
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              {["BR", "US", "PT", "MX"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                    country === c ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              variant="outline"
              className="w-12 h-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10"
            >
              <RefreshCcw className={cn("w-4 h-4", isSearching && "animate-spin")} />
            </Button>
          </div>
        </div>

        <Card className="bg-white/[0.02] border-white/5 p-2 rounded-[2.5rem] flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-white transition-colors" />
            <Input
              placeholder="Filtrar por nicho (ex: cosméticos, dropshipping...)"
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-16 bg-transparent border-none pl-16 text-lg font-medium focus-visible:ring-0 placeholder:text-gray-700"
            />
          </div>
          
          <div className="h-16 w-px bg-white/5 hidden md:block" />

          <div className="flex items-center px-6 gap-4">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">Score Mínimo</span>
            <div className="flex gap-1">
              {[0, 50, 80].map((s) => (
                <button
                  key={s}
                  onClick={() => setMinScore(s)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-xs font-bold border transition-all",
                    minScore === s 
                      ? "bg-white border-white text-black" 
                      : "bg-transparent border-white/5 text-gray-500 hover:border-white/20"
                  )}
                >
                  {s}+
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isSearching} className="h-16 px-10 rounded-[2rem] btn-premium">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sincronizar Escala"}
          </Button>
        </Card>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-40 gap-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-white/5 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Analisando Big Data</p>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Meta Ad Library API v21.0</p>
                </div>
              </motion.div>
            ) : filteredAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredAds.map((ad, i) => (
                  <motion.div
                    key={ad.id || i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                  >
                    <AdCard ad={ad} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Zap}
                title="Nenhum anúncio escalado"
                description="Tente ajustar os filtros ou pesquisar por um termo diferente para encontrar criativos em escala."
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
