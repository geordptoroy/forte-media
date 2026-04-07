import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import {
  Heart,
  Search,
  Loader2,
  RefreshCw,
  Filter,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState("");

  const favoritesQuery = trpc.ads.getFavorites.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const favorites = favoritesQuery.data?.favorites || [];
  
  const filteredFavorites = favorites.filter((ad) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const adBody = ad.adCreativeBodies?.[0] || "";
    return (
      (ad.pageName || "").toLowerCase().includes(query) ||
      adBody.toLowerCase().includes(query) ||
      (ad.adId || "").toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <PageHeader
            title="Minha Biblioteca"
            subtitle="Sua coleção curada de criativos, ofertas e estratégias vencedoras."
          />
          <Button
            variant="outline"
            onClick={() => favoritesQuery.refetch()}
            disabled={favoritesQuery.isFetching}
            className="border-white/10 hover:bg-white/5 h-11 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", favoritesQuery.isFetching && "animate-spin")} />
            Sincronizar Biblioteca
          </Button>
        </div>

        {/* Filters Bar */}
        <Card className="bg-black/40 border-white/5 p-6 backdrop-blur-xl sticky top-4 z-30 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por anunciante, texto do criativo ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-10 h-11"
              />
            </div>
            <div className="flex items-center gap-4 px-6 border-l border-white/5">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {favorites.length} Salvos
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        <div className="space-y-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {favoritesQuery.isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4"
              >
                <Loader2 className="w-10 h-10 animate-spin text-white/20" />
                <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">Carregando sua biblioteca...</p>
              </motion.div>
            ) : filteredFavorites.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFavorites.map((ad, i) => (
                    <motion.div
                      key={ad.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <AdCard 
                        ad={{
                          ...ad,
                          id: ad.adId, // Map adId to id for AdCard
                          ad_snapshot_url: ad.adSnapshotUrl,
                          page_name: ad.pageName,
                          ad_creative_bodies: ad.adCreativeBodies,
                          ad_delivery_start_time: ad.adDeliveryStartTime,
                          ad_delivery_stop_time: ad.adDeliveryStopTime,
                          publisher_platforms: ad.publisherPlatforms,
                          currency: ad.currency,
                          spend: ad.spend,
                          impressions: ad.impressions
                        }} 
                        initialIsFavorited={true} 
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <EmptyState
                icon={Heart}
                title={searchQuery ? "Nenhum favorito encontrado" : "Sua biblioteca está vazia"}
                description={searchQuery 
                  ? "Tente buscar por termos diferentes ou IDs específicos." 
                  : "Explore a Dashboard de Escala e salve os melhores anúncios para vê-los aqui."}
                actionLabel={!searchQuery ? "Explorar Anúncios" : "Limpar Busca"}
                onAction={() => searchQuery ? setSearchQuery("") : (window.location.href = "/dashboard")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
