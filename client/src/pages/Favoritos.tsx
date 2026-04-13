import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCardV3 } from "@/components/ads/AdCardV3";
import { Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";

export default function Favoritos() {
  const { data, isLoading } = trpc.ads.getFavorites.useQuery();
  const favorites = data?.success ? data.data : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-red-500" />
              <h1 className="text-lg font-black text-white tracking-tight">Favoritos</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Seus anúncios salvos com metadados completos e histórico de mineração.
            </p>
          </div>
          {favorites.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Salvos</p>
                <p className="text-sm font-black text-white">{favorites.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Carregando Favoritos...</p>
              </div>
            ) : favorites.length > 0 ? (
              favorites.map((ad: any) => (
                <motion.div
                  key={ad.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdCardV3 ad={ad} initialIsFavorited={true} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12">
                <EmptyState
                  icon={Heart}
                  title="Nenhum favorito"
                  description="Você ainda não salvou nenhum anúncio. Explore o minerador e clique no coração para salvar anúncios estratégicos."
                  actionLabel="Ir para o Minerador"
                  onAction={() => window.location.href = "/minerador"}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
