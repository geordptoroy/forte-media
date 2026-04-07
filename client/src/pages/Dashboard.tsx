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
  Pickaxe,
  Loader2,
  Search,
  RefreshCcw,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Países prioritários para o seletor rápido do Dashboard
// Para seleção completa (240+ países), usar AdvancedSearch com RegionSelector
const COUNTRIES = [
  { code: "BR", label: "Brasil" },
  { code: "US", label: "EUA" },
  { code: "PT", label: "Portugal" },
  { code: "MX", label: "México" },
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "CO", label: "Colômbia" },
  { code: "PE", label: "Peru" },
  { code: "GB", label: "UK" },
  { code: "DE", label: "Alemanha" },
  { code: "ES", label: "Espanha" },
  { code: "AU", label: "Austrália" },
  { code: "CA", label: "Canadá" },
  { code: "IN", label: "Índia" },
];

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
        toast.success(`${result.data.data.length} anúncios minerados`);
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
  const scaledCount = ads.filter(ad => (ad.scalingScore || 0) >= 70).length;
  const moderateCount = ads.filter(ad => (ad.scalingScore || 0) >= 40 && (ad.scalingScore || 0) < 70).length;

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
                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Moderado</p>
                <p className="text-sm font-black text-yellow-500">{moderateCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-0 border border-white/[0.06] bg-black">
          {/* Country selector */}
          <div className="flex border-b md:border-b-0 md:border-r border-white/[0.06]">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className={cn(
                  "px-4 py-3 text-[10px] font-black transition-all border-r border-white/[0.06] last:border-r-0",
                  country === c.code
                    ? "bg-white text-black"
                    : "text-gray-600 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {c.code}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              placeholder="Buscar nicho (ex: cosméticos, dropshipping, suplementos...)"
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-12 bg-transparent border-none pl-12 text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none"
            />
          </div>

          {/* Score filter */}
          <div className="flex items-center px-4 gap-2 border-t md:border-t-0 md:border-l border-white/[0.06]">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">Score</span>
            <div className="flex gap-0.5">
              {[0, 40, 70].map((s) => (
                <button
                  key={s}
                  onClick={() => setMinScore(s)}
                  className={cn(
                    "w-9 h-9 text-[10px] font-black border transition-all",
                    minScore === s
                      ? "bg-white border-white text-black"
                      : "bg-transparent border-white/[0.06] text-gray-600 hover:border-white/20 hover:text-white"
                  )}
                >
                  {s}+
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex border-t md:border-t-0 md:border-l border-white/[0.06]">
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

        {/* Results */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4"
              >
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border border-white/10" />
                  <div className="absolute inset-0 border border-white border-t-transparent animate-spin" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Minerando Dados</p>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Meta Ad Library API v21.0</p>
                </div>
              </motion.div>
            ) : filteredAds.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.04]"
              >
                {filteredAds.map((ad, i) => (
                  <motion.div
                    key={ad.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="bg-black"
                  >
                    <AdCard ad={ad} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={Pickaxe}
                title="Nenhum anúncio encontrado"
                description="Ajuste os filtros ou busque por outro termo para encontrar criativos em escala."
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
