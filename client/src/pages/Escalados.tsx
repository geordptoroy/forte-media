import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCardV3 } from "@/components/ads/AdCardV3";
import { Loader2, Trophy, RefreshCcw, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

type ScaleIntensity = "all" | "media" | "alta" | "massiva";

export default function Escalados() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleIntensity, setScaleIntensity] = useState<ScaleIntensity>("all");
  const [nicheFilter, setNicheFilter] = useState<string>("");

  const niches = ["Infoproduto", "Nutra", "SaaS", "E-commerce", "Imobiliário"];

  const getScaledAdsQuery = trpc.ads.getScaledAds.useQuery(
    { limit: 50, niche: nicheFilter || undefined },
    { enabled: false }
  );

  const loadScaledAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.ads) {
        let filtered = result.data.ads;
        if (scaleIntensity !== "all") {
          filtered = filtered.filter((ad: any) => {
            const score = ad.scaleScore || ad.scale_score || 0;
            if (scaleIntensity === "media") return score >= 20 && score < 40;
            if (scaleIntensity === "alta") return score >= 40 && score < 70;
            if (scaleIntensity === "massiva") return score >= 70;
            return true;
          });
        }
        setAds(filtered);
        if (filtered.length > 0) toast.success(`${filtered.length} anúncios escalados carregados`);
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    } catch (error) {
      toast.error("Erro ao buscar anúncios escalados");
    } finally {
      setIsLoading(false);
    }
  }, [getScaledAdsQuery, scaleIntensity]);

  useEffect(() => {
    loadScaledAds();
  }, []);

  const intensityOptions: { value: ScaleIntensity; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "media", label: "Média" },
    { value: "alta", label: "Alta" },
    { value: "massiva", label: "Massiva" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h1 className="text-lg font-black text-white tracking-tight">Escalados</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Anúncios curados automaticamente pelo algoritmo. Sorteio diário de melhores ofertas para clonar.
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

        <div className="border border-white/[0.06] bg-black">
          <div className="flex flex-col gap-0">
            <div className="flex flex-col md:flex-row gap-0">
              <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-white/[0.06] px-4 py-3">
                <Zap className="w-4 h-4 text-gray-600 mr-3" />
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mr-4 whitespace-nowrap">
                  Intensidade:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {intensityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScaleIntensity(option.value)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border transition-all",
                        scaleIntensity === option.value
                          ? "bg-white text-black border-white"
                          : "bg-transparent border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={loadScaledAds}
                disabled={isLoading}
                className="w-12 h-12 border-l border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="border-t border-white/[0.06] px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1 whitespace-nowrap">
                  Nicho
                </span>
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
            </div>
          </div>
        </div>

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
                  icon={Trophy}
                  title={isLoading ? "Carregando..." : "Nenhum anúncio escalado encontrado"}
                  description={
                    isLoading
                      ? "Buscando os melhores anúncios escalados..."
                      : "Ajuste os filtros de intensidade ou nicho. Anúncios aparecem aqui quando têm score >= 70."
                  }
                  actionLabel="Recarregar"
                  onAction={loadScaledAds}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
