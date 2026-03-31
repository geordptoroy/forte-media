import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  ChevronLeft,
  Trash2,
  DollarSign,
  Eye,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Query tRPC real para buscar favoritos do banco de dados
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
    removeFavoriteMutation.mutate({ favoriteId: id });
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

  if (favoritesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Anúncios Favoritos
              </h1>
              <p className="text-xs text-muted-foreground">
                Seus anúncios salvos para análise posterior
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => favoritesQuery.refetch()}
            disabled={favoritesQuery.isFetching}
            className="border-border"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${favoritesQuery.isFetching ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Error state */}
        {favoritesQuery.isError && (
          <Card className="border-border/50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Erro ao carregar favoritos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {favoritesQuery.error?.message || "Tente novamente mais tarde"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search */}
        <Card className="border-border/50 p-4">
          <div className="relative">
            <Input
              placeholder="Buscar nos favoritos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              strokeWidth={2}
            />
          </div>
        </Card>

        {/* Results */}
        {favorites.length === 0 ? (
          <Card className="border-border/50 p-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum favorito ainda
            </h3>
            <p className="text-muted-foreground mb-6">
              Adicione anúncios aos favoritos em Inteligência Competitiva ou Anúncios Escalados para acompanhá-los aqui
            </p>
            <Button
              onClick={() => setLocation("/competitive-intelligence")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Ir para Inteligência Competitiva
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {filteredFavorites.length} Favorito{filteredFavorites.length !== 1 ? "s" : ""}
            </h2>
            <div className="grid gap-4">
              {filteredFavorites.map((ad) => (
                <Card
                  key={ad.id}
                  className="border-border/50 p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {ad.pageName || "Anúncio"}
                      </h3>
                      {ad.adBody && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {ad.adBody}
                        </p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Gasto</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.spend ? `$${ad.spend}` : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Impressões</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.impressions
                                ? Number(ad.impressions).toLocaleString("pt-BR")
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">ID do Anúncio</p>
                            <p className="text-sm font-medium text-foreground font-mono text-xs truncate max-w-[100px]">
                              {ad.adId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Salvo em</p>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(ad.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(ad.id)}
                      disabled={removeFavoriteMutation.isPending}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" strokeWidth={2} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
