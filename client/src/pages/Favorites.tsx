import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  Trash2,
  DollarSign,
  Eye,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Favorites() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const favoritesQuery = trpc.ads.getFavorites.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const removeFavoriteMutation = trpc.ads.removeFavorite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Anúncio removido dos favoritos");
        favoritesQuery.refetch();
      } else {
        toast.error(data.error || "Erro ao remover favorito");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover favorito");
    },
  });

  const handleRemoveFavorite = (id: number) => {
    if (confirm("Deseja remover este anúncio dos seus favoritos?")) {
      removeFavoriteMutation.mutate({ favoriteId: id });
    }
  };

  const favorites = favoritesQuery.data?.favorites || [];

  const filteredFavorites = favorites.filter((ad) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (ad.pageName || "").toLowerCase().includes(query) ||
      (ad.adBody || "").toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Favoritos</h1>
            <p className="text-gray-500 font-medium">Sua biblioteca pessoal de criativos e estratégias vencedoras.</p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => favoritesQuery.refetch()}
            disabled={favoritesQuery.isFetching}
            className="border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${favoritesQuery.isFetching ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Filtrar por nome da página ou conteúdo do anúncio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-12 border-none focus:ring-0"
            />
          </div>
        </Card>

        {/* Error State */}
        {favoritesQuery.isError && (
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-500 font-medium">Erro ao carregar seus favoritos. Por favor, tente novamente.</p>
          </div>
        )}

        {/* Loading State */}
        {favoritesQuery.isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-white/20" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Carregando Biblioteca...</p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <Card className="card-premium bg-white/[0.01] border-white/5 p-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Heart className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sua biblioteca está vazia</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Salve anúncios interessantes durante suas buscas para que eles apareçam aqui.
            </p>
            <Button
              onClick={() => setLocation("/competitive-intelligence")}
              className="btn-premium px-8"
            >
              Explorar Anúncios
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredFavorites.map((ad) => (
              <Card key={ad.id} className="card-premium bg-white/[0.02] border-white/5 p-8 group hover:border-white/20 transition-all">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Preview Placeholder */}
                  <div className="w-full md:w-48 h-60 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                    <Eye className="w-8 h-8 text-gray-800" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[10px] font-bold text-white uppercase truncate">{ad.pageName}</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary-foreground transition-colors">
                          {ad.pageName || "Anúncio Salvo"}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                          ID: {ad.adId}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-600 hover:text-white hover:bg-white/5"
                          title="Ver na Biblioteca de Anúncios"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFavorite(ad.id)}
                          disabled={removeFavoriteMutation.isPending}
                          className="text-gray-600 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed mb-8 line-clamp-2 italic">
                      "{ad.adBody || "Sem descrição disponível."}"
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3" /> Gasto Est.
                        </p>
                        <p className="text-sm font-bold text-white">{ad.spend ? `$${ad.spend}` : "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> Impressões
                        </p>
                        <p className="text-sm font-bold text-white">
                          {ad.impressions ? Number(ad.impressions).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> Salvo em
                        </p>
                        <p className="text-sm font-bold text-white">
                          {new Date(ad.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
