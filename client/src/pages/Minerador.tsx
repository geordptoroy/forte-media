import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, AlertCircle, Globe, LayoutGrid, Tag, Package, Clock, Sparkles, ChevronDown, Zap, ArrowUpDown, EyeOff, RefreshCw, Layers } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import DashboardLayout from "../components/DashboardLayout";
import { AdCardV3 } from "../components/ads/AdCardV3";
import { AdDetailsModal } from "../components/ads/AdDetailsModal";
import { Badge } from "../components/ui/badge";

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "EUA" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "GB", name: "Reino Unido" },
  { code: "FR", name: "França" },
  { code: "DE", name: "Alemanha" },
  { code: "IT", name: "Itália" },
  { code: "CA", name: "Canadá" },
  { code: "AU", name: "Austrália" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colômbia" },
  { code: "CL", name: "Chile" },
];

const PRODUCT_TYPES = [
  "Todos", "Infoproduto", "Suplementos/Nutra", "Dropshipping", "Comércio Local", "Moda", "Eletrônicos", "Serviços", "Outros"
];

const FUNNEL_STRUCTURES = [
  "Todos", "TSL", "VSL", "X1", "Landing Page", "Quiz", "Type Bot"
];

const MiniLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5 ml-1 block font-mono">
    {children}
  </label>
);

export default function Minerador() {
  const [filters, setFilters] = useState({
    searchTerms: "",
    country: "BR",
    adType: "ALL" as "ALL" | "POLITICAL_AND_ISSUE_ADS" | "NON_POLITICAL",
    selectedType: "Todos",
    selectedFunnel: "Todos",
    activeSince: "anytime"
  });

  const [sortConfig, setSortConfig] = useState({
    field: "frequency" as "frequency" | "date",
    direction: "desc" as "asc" | "desc"
  });

  const [hidePolitical, setHidePolitical] = useState(true);
  const [hideLowFrequency, setHideLowFrequency] = useState(false);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedAd, setSelectedAd] = useState<{ ad: any, media: any } | null>(null);
  const [syncKey, setSyncKey] = useState(0);
  
  const loaderRef = useRef<HTMLDivElement>(null);

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const searchMutation = trpc.ads.search.useQuery(
    { 
      searchTerms: filters.searchTerms, 
      country: filters.country, 
      adType: hidePolitical ? "ALL" : "POLITICAL_AND_ISSUE_ADS",
      after: nextCursor
    },
    { 
      enabled: false,
      retry: false,
    }
  );

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setAllAds([]);
    setNextCursor(undefined);
    
    const result = await searchMutation.refetch();
    if (result.data) {
      setAllAds(result.data.data);
      setNextCursor(result.data.paging?.next_cursor);
    }
  };

  const fetchMore = async () => {
    if (isFetchingMore || !nextCursor) return;
    setIsFetchingMore(true);
    
    try {
      const result = await searchMutation.refetch();
      if (result.data) {
        setAllAds(prev => [...prev, ...result.data.data]);
        setNextCursor(result.data.paging?.next_cursor);
      }
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Lógica de Filtragem Local (Multi-Select Heurística)
  const processedAds = useMemo(() => {
    let filtered = [...allAds];

    if (hideLowFrequency) {
      filtered = filtered.filter(ad => (ad.frequency || 0) > 2);
    }

    // Filtro de Tipo de Produto
    if (filters.selectedType !== "Todos") {
      filtered = filtered.filter(ad => ad.detectedTypes?.includes(filters.selectedType));
    }

    // Filtro de Estrutura de Funil
    if (filters.selectedFunnel !== "Todos") {
      filtered = filtered.filter(ad => ad.detectedFunnels?.includes(filters.selectedFunnel));
    }

    return filtered.sort((a, b) => {
      if (sortConfig.field === "frequency") {
        return sortConfig.direction === "desc" 
          ? (b.frequency || 0) - (a.frequency || 0)
          : (a.frequency || 0) - (b.frequency || 0);
      } else {
        const dateA = new Date(a.ad_delivery_start_time).getTime();
        const dateB = new Date(b.ad_delivery_start_time).getTime();
        return sortConfig.direction === "desc" ? dateB - dateA : dateA - dateB;
      }
    });
  }, [allAds, sortConfig, hideLowFrequency, filters.selectedType, filters.selectedFunnel]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isFetchingMore) {
          fetchMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [nextCursor, isFetchingMore]);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto px-4 md:px-6">
        
        {/* Header Compacto */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">Minerador Pro</h1>
            {processedAds.length > 0 && (
              <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black px-2 py-0">
                {processedAds.length} RESULTADOS
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-lg">
              <Filter className="w-3 h-3 text-white/40" />
              <span className="text-[9px] font-black uppercase text-white/60">Ocultar Políticos</span>
              <Switch 
                checked={hidePolitical} 
                onCheckedChange={setHidePolitical}
                className="scale-75 data-[state=checked]:bg-emerald-500"
              />
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSyncKey(prev => prev + 1)}
              className="h-8 border-white/10 bg-white/5 text-[9px] font-black uppercase hover:bg-white/10"
            >
              <RefreshCw className="w-3 h-3 mr-2" /> Sincronizar Tudo
            </Button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <Card className="p-4 bg-[#0A0A0A] border-white/[0.08] rounded-xl shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end gap-3">
            <div className="flex-1 w-full space-y-0">
              <MiniLabel>Palavra-chave</MiniLabel>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                <Input
                  placeholder="Ex: Emagrecimento..."
                  value={filters.searchTerms}
                  onChange={(e) => updateFilter("searchTerms", e.target.value)}
                  className="pl-9 bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-xs font-medium focus:border-white/20 focus:ring-0 transition-all placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:flex items-end gap-2 w-full lg:w-auto">
              <div className="space-y-0">
                <MiniLabel>Ordenação</MiniLabel>
                <Select 
                  value={`${sortConfig.field}-${sortConfig.direction}`} 
                  onValueChange={(v) => {
                    const [field, direction] = v.split("-");
                    setSortConfig({ field: field as any, direction: direction as any });
                  }}
                >
                  <SelectTrigger className="w-full lg:w-[130px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <ArrowUpDown className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Ordenar" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    <SelectItem value="frequency-desc" className="text-[10px] font-black uppercase py-2">Mais Frequentes</SelectItem>
                    <SelectItem value="frequency-asc" className="text-[10px] font-black uppercase py-2">Menos Frequentes</SelectItem>
                    <SelectItem value="date-desc" className="text-[10px] font-black uppercase py-2">Mais Recentes</SelectItem>
                    <SelectItem value="date-asc" className="text-[10px] font-black uppercase py-2">Mais Antigos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>País</MiniLabel>
                <Select value={filters.country} onValueChange={(v) => updateFilter("country", v)}>
                  <SelectTrigger className="w-full lg:w-[90px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="País" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[10px] font-black uppercase py-2">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>Tipo Produto</MiniLabel>
                <Select value={filters.selectedType} onValueChange={(v) => updateFilter("selectedType", v)}>
                  <SelectTrigger className="w-full lg:w-[120px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Package className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-[10px] font-black uppercase py-2">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>Funil</MiniLabel>
                <Select value={filters.selectedFunnel} onValueChange={(v) => updateFilter("selectedFunnel", v)}>
                  <SelectTrigger className="w-full lg:w-[110px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Funil" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {FUNNEL_STRUCTURES.map((f) => (
                      <SelectItem key={f} value={f} className="text-[10px] font-black uppercase py-2">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>



              <Button 
                type="submit"
                disabled={searchMutation.isLoading}
                className="w-full lg:w-10 h-10 bg-white text-black hover:bg-white/90 rounded-lg shadow-lg shadow-white/5 transition-all active:scale-95 flex items-center justify-center p-0 shrink-0"
              >
                {searchMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </Card>

        {/* Grid de Resultados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedAds.map((ad) => (
            <AdCardV3 key={ad.id} ad={ad} syncKey={syncKey} />
          ))}
        </div>

        {/* Loading State & Infinite Scroll Target */}
        <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center gap-4">
          {isFetchingMore && (
            <>
              <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Carregando mais criativos...</p>
            </>
          )}
          {!isFetchingMore && hasSearched && processedAds.length === 0 && (
            <div className="flex flex-col items-center gap-3 text-white/20">
              <AlertCircle className="w-8 h-8" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum anúncio encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedAd && (
        <AdDetailsModal 
          ad={selectedAd.ad} 
          media={selectedAd.media} 
          isOpen={!!selectedAd} 
          onClose={() => setSelectedAd(null)} 
        />
      )}
    </DashboardLayout>
  );
}
