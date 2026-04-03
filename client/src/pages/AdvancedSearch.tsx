import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdCard } from "@/components/ads/AdCard";
import { PageHeader } from "@/components/PageHeader";
import { CredentialsWarning } from "@/components/CredentialsWarning";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Loader2, Filter, Globe, Layers } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { usePagination } from "@/hooks/usePagination";

export default function AdvancedSearch() {
  const [filters, setFilters] = useState({
    keywords: "",
    media_type: "",
    country: "BR",
    ad_type: "ALL" as "ALL" | "POLITICAL" | "ISSUE_ADS",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ads, setAds] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const searchAdsQuery = trpc.meta.searchAds.useQuery(
    {
      searchTerms: filters.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      countries: [filters.country || "BR"],
      limit: 50,
    },
    { enabled: false }
  );

  const { page, totalPages, paginatedItems, goToNext, goToPrev, hasNext, hasPrev, reset } =
    usePagination(ads, 12);

  const handleSearch = async () => {
    if (!credentialsStatus.data?.hasCredentials) {
      toast.error("Configure suas credenciais Meta primeiro");
      return;
    }
    if (!filters.keywords.trim()) {
      toast.error("Insira pelo menos uma palavra-chave");
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    reset();
    try {
      const result = await searchAdsQuery.refetch();
      if (result.data?.ads) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let filtered: any[] = result.data.ads;
        if (filters.media_type) {
          filtered = filtered.filter((ad) => {
            if (filters.media_type === "video")
              return (ad.publisher_platforms as string[])?.includes("instagram");
            return true;
          });
        }
        setAds(filtered);
        toast.success(`${filtered.length} anuncios encontrados`);
      } else {
        toast.info("Nenhum anuncio encontrado");
        setAds([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao buscar anuncios"
      );
      setAds([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Busca Avancada"
          subtitle="Filtros granulares para encontrar exatamente o que voce precisa na Meta Ad Library."
          actions={
            <Button
              onClick={handleSearch}
              disabled={
                isSearching ||
                !credentialsStatus.data?.hasCredentials ||
                !filters.keywords.trim()
              }
              className="btn-premium"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Executar Busca
                </>
              )}
            </Button>
          }
        />

        {/* Aviso de credenciais */}
        {!credentialsStatus.isLoading && !credentialsStatus.data?.hasCredentials && (
          <CredentialsWarning message="A busca na Meta Ad Library requer uma conexao ativa com a Meta API." />
        )}

        {/* Filters */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Filtros de Busca
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Keywords */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Palavras-chave
              </label>
              <Input
                placeholder="Ex: emagrecimento, curso online..."
                value={filters.keywords}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, keywords: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className="input-premium"
              />
              <p className="text-[10px] text-gray-600">
                Separe multiplas palavras com virgula
              </p>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Pais
              </label>
              <Select
                value={filters.country}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, country: v }))
                }
              >
                <SelectTrigger className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">Brasil</SelectItem>
                  <SelectItem value="US">Estados Unidos</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="MX">Mexico</SelectItem>
                  <SelectItem value="AR">Argentina</SelectItem>
                  <SelectItem value="CO">Colombia</SelectItem>
                  <SelectItem value="ALL">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ad Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Tipo de Anuncio
              </label>
              <Select
                value={filters.ad_type}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    ad_type: v as typeof filters.ad_type,
                  }))
                }
              >
                <SelectTrigger className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="POLITICAL">Politico</SelectItem>
                  <SelectItem value="ISSUE_ADS">Questoes Sociais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              <p className="text-sm text-gray-500">Buscando anuncios...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isSearching && (
          <>
            {ads.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Search className="w-3.5 h-3.5" />
                  <span className="font-bold">
                    {ads.length} resultado{ads.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  Pagina {page} de {totalPages}
                </span>
              </div>
            )}

            {hasSearched && ads.length === 0 && (
              <EmptyState
                icon={Search}
                title="Nenhum resultado encontrado"
                description="Tente palavras-chave diferentes ou ajuste os filtros de busca."
              />
            )}

            {!hasSearched && ads.length === 0 && (
              <EmptyState
                icon={Search}
                title="Pronto para buscar"
                description="Insira palavras-chave e clique em Executar Busca para encontrar anuncios na Meta Ad Library."
              />
            )}

            {paginatedItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((ad, i) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <AdCard key={((ad as any).id as string) || String(i)} ad={ad as any} />
                ))}
              </div>
            )}

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPrev={goToPrev}
              onNext={goToNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
