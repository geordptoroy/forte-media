import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, AlertCircle, Globe, Package, Diamond, Layers, X, ArrowUpDown } from "lucide-react";
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
  { code: "ALL", name: "Todos" },
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
  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-1.5 ml-1 block font-mono">
    {children}
  </label>
);

export default function Minerador() {
  // --- ESTADO ---
  const [filters, setFilters] = useState({
    searchTerms: "",
    country: "BR",
    selectedType: "Todos",
    selectedFunnel: "Todos",
  });

  const [hidePolitical, setHidePolitical] = useState(() => {
    const saved = localStorage.getItem("hidePolitical");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [allAds, setAllAds] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedAd, setSelectedAd] = useState<{ ad: any, media: any } | null>(null);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadLimit] = useState(20);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- PERSISTÊNCIA ---
  useEffect(() => {
    localStorage.setItem("hidePolitical", JSON.stringify(hidePolitical));
  }, [hidePolitical]);

  // --- BUSCA (API) ---
  const searchMutation = trpc.ads.search.useQuery(
    { 
      searchTerms: filters.searchTerms, 
      country: filters.country, 
      adType: "ALL",
      after: nextCursor
    },
    { enabled: false, retry: false }
  );

  const startAutoLoad = async (currentCount: number, cursor: string) => {
    setIsAutoLoading(true);
    let totalLoaded = currentCount;
    let currentCursor: string | undefined = cursor;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      while (totalLoaded < autoLoadLimit && currentCursor && !controller.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 400)); // Delay preventivo
        if (controller.signal.aborted) break;

        const result = await searchMutation.refetch();
        if (!result.data || controller.signal.aborted) break;

        const newAds = result.data.data;
        setAllAds(prev => [...prev, ...newAds]);
        totalLoaded += newAds.length;
        currentCursor = result.data.paging?.next_cursor;
        setNextCursor(currentCursor);

        if (!currentCursor) break;
      }
    } catch (error) {
      console.error("Erro no auto-carregamento:", error);
    } finally {
      setIsAutoLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsAutoLoading(false);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setHasSearched(true);
    setAllAds([]);
    setNextCursor(undefined);
    
    const result = await searchMutation.refetch();
    if (result.data) {
      const ads = result.data.data;
      setAllAds(ads);
      const cursor = result.data.paging?.next_cursor;
      setNextCursor(cursor);

      // Auto-load padrão até o limite
      if (ads.length < autoLoadLimit && cursor) {
        startAutoLoad(ads.length, cursor);
      }
    }
  }, [filters.searchTerms, filters.country, searchMutation, autoLoadLimit]);

  // --- REATIVIDADE ---
  // Debounce para busca por palavra-chave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.searchTerms || hasSearched) handleSearch();
    }, 600);
    return () => clearTimeout(timer);
  }, [filters.searchTerms]);

  // Atualização imediata para País e Ads Políticos (Filtros Globais)
  useEffect(() => {
    if (hasSearched) handleSearch();
  }, [filters.country, hidePolitical]);

  // --- FILTRAGEM LOCAL (ALTA PERFORMANCE) ---
  const processedAds = useMemo(() => {
    let filtered = [...allAds];

    // 1. Filtro de Ads Políticos/Sociais
    filtered = filtered.filter(ad => {
      const isPolitical = !!ad.bylines;
      return hidePolitical ? !isPolitical : isPolitical;
    });

    // 2. Filtro de Tipo de Produto (Heurística de inclusão)
    if (filters.selectedType !== "Todos") {
      filtered = filtered.filter(ad => 
        ad.detectedTypes?.some((t: string) => t === filters.selectedType)
      );
    }

    // 3. Filtro de Estrutura de Funil (Heurística de inclusão)
    if (filters.selectedFunnel !== "Todos") {
      filtered = filtered.filter(ad => 
        ad.detectedFunnels?.some((f: string) => f === filters.selectedFunnel)
      );
    }

    // 4. Ordenação Padrão (Mais Frequentes / Recentes)
    return filtered.sort((a, b) => {
      const freqDiff = (b.frequency || 0) - (a.frequency || 0);
      if (freqDiff !== 0) return freqDiff;
      return new Date(b.ad_delivery_start_time).getTime() - new Date(a.ad_delivery_start_time).getTime();
    });
  }, [allAds, hidePolitical, filters.selectedType, filters.selectedFunnel]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-5 max-w-[1600px] mx-auto px-4 md:px-6 scale-[0.95] origin-top">
        
        {/* Título Principal */}
        <div className="mb-6">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">Minerador</span>
            <span className="text-white/20 font-light text-xl">Pro</span>
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mt-3">Busca Avançada de Anúncios Meta</p>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-transparent flex items-center justify-center overflow-hidden">
              <img src="https://img.icons8.com/external-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto/64/external-pickaxe-construction-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto.png" alt="Minerador" className="w-6 h-6 object-contain" />
            </div>
            {processedAds.length > 0 && (
              <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black px-2 py-0">
                {processedAds.length} RESULTADOS
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/20 px-4 py-2 rounded-lg w-fit">
              <Filter className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[11px] font-black uppercase text-white/90 whitespace-nowrap">
                {hidePolitical ? "Ocultar Ads Políticos e Sociais" : "Apenas Ads Políticos e Sociais"}
              </span>
              <Switch 
                checked={hidePolitical} 
                onCheckedChange={setHidePolitical}
                className="scale-90 data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Barra de Filtros Refatorada */}
        <Card className="p-4 bg-[#0A0A0A] border-white/20 rounded-xl shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end gap-3">
            <div className="w-full lg:w-[25%] space-y-0">
              <MiniLabel>Palavra-chave</MiniLabel>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60 group-focus-within:text-white transition-colors" />
                <Input
                  placeholder="Ex: Emagrecimento..."
                  value={filters.searchTerms}
                  onChange={(e) => updateFilter("searchTerms", e.target.value)}
                  className="pl-9 bg-white/[0.03] border-white/20 rounded-lg h-10 text-[13px] font-medium focus:border-white/40 focus:ring-0 transition-all placeholder:text-white/40"
                />
                {filters.searchTerms && (
                  <button 
                    type="button"
                    onClick={() => updateFilter("searchTerms", "")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:flex items-end gap-2 w-full lg:w-auto">
              <div className="flex-1 space-y-0">
                <MiniLabel>País</MiniLabel>
                <Select value={filters.country} onValueChange={(v) => updateFilter("country", v)}>
                  <SelectTrigger className="w-full bg-white/[0.03] border-white/20 rounded-lg h-10 text-[11px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3 h-3 text-white/60 shrink-0" />
                      <SelectValue placeholder="País" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[11px] font-black uppercase py-2">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-0">
                <MiniLabel>Tipo Produto</MiniLabel>
                <Select value={filters.selectedType} onValueChange={(v) => updateFilter("selectedType", v)}>
                  <SelectTrigger className="w-full bg-white/[0.03] border-white/20 rounded-lg h-10 text-[11px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Package className="w-3 h-3 text-white/60 shrink-0" />
                      <SelectValue placeholder="Tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-[11px] font-black uppercase py-2">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-0">
                <MiniLabel>Funil</MiniLabel>
                <Select value={filters.selectedFunnel} onValueChange={(v) => updateFilter("selectedFunnel", v)}>
                  <SelectTrigger className="w-full bg-white/[0.03] border-white/20 rounded-lg h-10 text-[11px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-3 h-3 text-white/60 shrink-0" />
                      <SelectValue placeholder="Funil" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {FUNNEL_STRUCTURES.map((f) => (
                      <SelectItem key={f} value={f} className="text-[11px] font-black uppercase py-2">{f}</SelectItem>
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
            <AdCardV3 key={ad.id} ad={ad} />
          ))}
        </div>

        {/* Loading State */}
        <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center gap-4">
          {(searchMutation.isLoading || isAutoLoading) && (
            <>
              <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                {isAutoLoading ? `Sincronizando: ${allAds.length} de ${autoLoadLimit} anúncios...` : "Buscando criativos..."}
              </p>
            </>
          )}
          {!searchMutation.isLoading && hasSearched && processedAds.length === 0 && (
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
