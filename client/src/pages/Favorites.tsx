import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Heart,
  Trash2,
  DollarSign,
  Eye,
  Calendar,
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState("");

  const favoritesQuery = trpc.ads.getFavorites.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const removeFavoriteMutation = trpc.ads.removeFavorite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Anuncio removido dos favoritos");
        favoritesQuery.refetch();
      } else {
        toast.error("Erro ao remover favorito");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover favorito");
    },
  });

  const handleRemoveFavorite = (adId: string) => {
    if (confirm("Deseja remover este anuncio dos seus favoritos?")) {
      removeFavoriteMutation.mutate({ adId });
    }
  };

  const favorites = favoritesQuery.data?.favorites || [];
  const filteredFavorites = favorites.filter((ad) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const adBody = ad.adCreativeBodies?.[0] || "";
    return (
      (ad.pageName || "").toLowerCase().includes(query) ||
      adBody.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Favoritos"
          subtitle="Sua biblioteca pessoal de criativos e estrategias vencedoras."
          actions={
            <Button
              variant="outline"
              onClick={() => favoritesQuery.refetch()}
              disabled={favoritesQuery.isFetching}
              className="border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${favoritesQuery.isFetching ? "animate-spin" : ""}`}
              />
              Sincronizar
            </Button>
          }
        />

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar nos favoritos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-10"
          />
        </div>

        {/* Loading */}
        {favoritesQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        )}

        {/* Empty State */}
        {!favoritesQuery.isLoading && filteredFavorites.length === 0 && (
          <EmptyState
            icon={Heart}
            title={searchQuery ? "Nenhum resultado" : "Nenhum favorito ainda"}
            description={
              searchQuery
                ? "Nenhum anuncio favorito corresponde a sua busca."
                : "Salve anuncios interessantes durante sua pesquisa para acessa-los rapidamente aqui."
            }
          />
        )}

        {/* Favorites Grid */}
        {filteredFavorites.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className="font-bold">
                {filteredFavorites.length} anuncio{filteredFavorites.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((ad) => {
                const spendMin = ad.spend?.min;
                const spendMax = ad.spend?.max;
                const impressionsMin = ad.impressions?.min;

                return (
                  <Card
                    key={ad.id}
                    className="card-premium-hover bg-white/[0.02] border-white/5 overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    {ad.adSnapshotUrl && (
                      <div className="aspect-video bg-white/5 overflow-hidden">
                        <img
                          src={ad.adSnapshotUrl}
                          alt={ad.pageName || "Ad"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="p-5">
                      {/* Page Name */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-sm font-bold text-white truncate">
                          {ad.pageName || "Pagina desconhecida"}
                        </h3>
                        <Heart className="w-4 h-4 text-red-500 shrink-0 fill-current" />
                      </div>

                      {/* Ad Body */}
                      {ad.adCreativeBodies?.[0] && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                          {ad.adCreativeBodies[0]}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {spendMin !== undefined && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {spendMax !== undefined
                                ? `$${spendMin}–$${spendMax}`
                                : `$${spendMin}+`}
                            </span>
                          </div>
                        )}
                        {impressionsMin !== undefined && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Eye className="w-3 h-3" />
                            <span>{(impressionsMin / 1000).toFixed(0)}k+</span>
                          </div>
                        )}
                        {ad.adDeliveryStartTime && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(ad.adDeliveryStartTime).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                        {ad.adDeliveryStopTime === null && ad.adDeliveryStartTime && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-green-500">Ativo</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {ad.adSnapshotUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 border-white/10 hover:bg-white/5 text-xs"
                          >
                            <a
                              href={ad.adSnapshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFavorite(ad.adId)}
                          disabled={removeFavoriteMutation.isPending}
                          className="border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
