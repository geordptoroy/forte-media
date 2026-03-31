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
  Users,
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Queries
  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  // Em produção, isso seria uma query real do backend
  // Por enquanto, retornamos um array vazio para indicar que não há favoritos salvos
  const [favorites, setFavorites] = useState<any[]>([]);

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter((fav) => fav.id !== id));
    toast.success("Anúncio removido dos favoritos");
  };

  const filteredFavorites = favorites.filter((ad) => {
    const matchesSearch =
      ad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || ad.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (credentialsStatus.isLoading) {
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
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-6 py-8">
        {!credentialsStatus.data?.isValid && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Credenciais não configuradas
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Configure suas credenciais Meta em Configurações para sincronizar favoritos
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Filter */}
        <Card className="border-border/50 p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Buscar nos favoritos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2} />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="all">Todos</option>
              <option value="product">Produtos</option>
              <option value="service">Serviços</option>
              <option value="brand">Marca</option>
            </select>
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
              Adicione anúncios aos favoritos em Inteligência Competitiva para acompanhá-los aqui
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
                        {ad.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {ad.body}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Gasto</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.spend}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Impressões</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.impressions}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Público</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.targetAudience}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Período</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.startDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFavorite(ad.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
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
