import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, Globe, Package, Layers, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import DashboardLayout from "../components/DashboardLayout";
import { AdCardV3 } from "../components/ads/AdCardV3";
import { AdDetailsModal } from "../components/ads/AdDetailsModal";
import { Badge } from "../components/ui/badge";
import { cn } from "@/lib/utils";

// --- CONSTANTES E CONFIGURAÇÕES ---
const SCALE_RANGES = [
  { min: 1, max: 5, label: "1-5" },
  { min: 6, max: 10, label: "6-10" },
  { min: 11, max: 20, label: "11-20" },
  { min: 21, max: 50, label: "21-50" }
];

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

const PRODUCT_TYPES = ["Todos", "Infoproduto", "Suplementos/Nutra", "Dropshipping", "Comércio Local", "Moda", "Eletrônicos", "Serviços", "Outros"];
const FUNNEL_STRUCTURES = ["Todos", "TSL", "VSL", "X1", "Landing Page", "Quiz", "Type Bot"];
const AUTO_LOAD_LIMIT = 20;

// --- SUB-COMPONENTES AUXILIARES ---
const MiniLabel = memo(({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-1.5 ml-1 block font-mono">
    {children}
  </label>
));

const PageHeader = memo(({ resultsCount, hidePolitical, onTogglePolitical }: { 
  resultsCount: number, 
  hidePolitical: boolean, 
  onTogglePolitical: (val: boolean) => void 
}) => (
  <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-transparent flex items-center justify-center overflow-hidden">
        <img src="https://img.icons8.com/external-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto/64/external-pickaxe-construction-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto.png" alt="Minerador" className="w-6 h-6 object-contain" />
      </div>
      {resultsCount > 0 && (
        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black px-2 py-0">
          {resultsCount} RESULTADOS
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
          onCheckedChange={onTogglePolitical}
          className="scale-90 data-[state=checked]:bg-emerald-500"
        />
      </div>
    </div>
  </div>
));

// --- COMPONENTE PRINCIPAL ---
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
  const [scaleRange, setScaleRange] = useState([1, 50]);
  const [durationRange, setDurationRange] = useState([1, 300]);
  
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

  const startAutoLoad = useCallback(async (currentCount: number, cursor: string) => {
    setIsAutoLoading(true);
    let totalLoaded = currentCount;
    let currentCursor: string | undefined = cursor;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      while (totalLoaded < AUTO_LOAD_LIMIT && currentCursor && !controller.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 400));
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
  }, [searchMutation]);

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

      if (ads.length < AUTO_LOAD_LIMIT && cursor) {
        startAutoLoad(ads.length, cursor);
      }
    }
  }, [searchMutation, startAutoLoad]);

  // --- REATIVIDADE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.searchTerms || hasSearched) handleSearch();
    }, 600);
    return () => clearTimeout(timer);
  }, [filters.searchTerms, handleSearch, hasSearched]);

  useEffect(() => {
    if (hasSearched) handleSearch();
  }, [filters.country, hidePolitical, handleSearch, hasSearched]);

  // --- FILTRAGEM LOCAL (ALTA PERFORMANCE) ---
  const processedAds = useMemo(() => {
    let filtered = allAds.filter(ad => {
      const isPolitical = !!ad.bylines;
      const matchesPolitical = hidePolitical ? !isPolitical : isPolitical;
      
      const matchesType = filters.selectedType === "Todos" || 
        ad.detectedTypes?.some((t: string) => t === filters.selectedType);
        
      const matchesFunnel = filters.selectedFunnel === "Todos" || 
        ad.detectedFunnels?.some((f: string) => f === filters.selectedFunnel);

      const frequency = ad.frequency || 1;
      const matchesScale = frequency >= scaleRange[0] && frequency <= scaleRange[1];
      
      const startDate = new Date(ad.ad_delivery_start_time);
      const now = new Date();
      const daysActive = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const matchesDuration = daysActive >= durationRange[0] && daysActive <= durationRange[1];

      return matchesPolitical && matchesType && matchesFunnel && matchesScale && matchesDuration;
    });

    return filtered.sort((a, b) => {
      const freqDiff = (b.frequency || 0) - (a.frequency || 0);
      if (freqDiff !== 0) return freqDiff;
      return new Date(b.ad_delivery_start_time).getTime() - new Date(a.ad_delivery_start_time).getTime();
    });
  }, [allAds, hidePolitical, filters.selectedType, filters.selectedFunnel, scaleRange, durationRange]);

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

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
        
        <PageHeader 
          resultsCount={processedAds.length} 
          hidePolitical={hidePolitical} 
          onTogglePolitical={setHidePolitical} 
        />

        {/* Barra de Filtros */}
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
            </div>

            <Button 
              type="submit"
              disabled={searchMutation.isFetching || isAutoLoading}
              className="w-full lg:w-auto h-10 bg-white text-black hover:bg-white/90 font-black uppercase text-[11px] tracking-widest px-8 rounded-lg shadow-lg shadow-white/5 transition-all disabled:opacity-50"
            >
              {searchMutation.isFetching || isAutoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Minerar"
              )}
            </Button>
          </form>
        </Card>

        {/* Filtros de Slider */}
        <Card className="p-6 bg-[#0A0A0A] border-white/20 rounded-xl shadow-xl space-y-8">
          {/* Filtro de Escala */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <MiniLabel>Escala de Anúncios Repetidos</MiniLabel>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                {scaleRange[0]} - {scaleRange[1]} anúncios
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="50" value={scaleRange[0]} onChange={(e) => setScaleRange([Math.min(parseInt(e.target.value), scaleRange[1]), scaleRange[1]])} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              <input type="range" min="1" max="50" value={scaleRange[1]} onChange={(e) => setScaleRange([scaleRange[0], Math.max(parseInt(e.target.value), scaleRange[0])])} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SCALE_RANGES.map((range) => (
                <Button key={range.label} variant="outline" size="sm" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", scaleRange[0] === range.min && scaleRange[1] === range.max ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500" : "border-white/10 text-white/60 hover:border-white/20")} onClick={() => setScaleRange([range.min, range.max])}>{range.label}</Button>
              ))}
            </div>
          </div>

          {/* Filtro de Duração */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <MiniLabel>Duração da Veiculação</MiniLabel>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                {durationRange[0]} - {durationRange[1]} dias
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="300" value={durationRange[0]} onChange={(e) => setDurationRange([Math.min(parseInt(e.target.value), durationRange[1]), durationRange[1]])} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              <input type="range" min="1" max="300" value={durationRange[1]} onChange={(e) => setDurationRange([durationRange[0], Math.max(parseInt(e.target.value), durationRange[0])])} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", durationRange[0] === 1 && durationRange[1] === 7 ? "bg-blue-500/20 border-blue-500/50 text-blue-500" : "border-white/10 text-white/60 hover:border-white/20")} onClick={() => setDurationRange([1, 7])}>1-7 dias</Button>
              <Button variant="outline" size="sm" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", durationRange[0] === 7 && durationRange[1] === 30 ? "bg-blue-500/20 border-blue-500/50 text-blue-500" : "border-white/10 text-white/60 hover:border-white/20")} onClick={() => setDurationRange([7, 30])}>7-30 dias</Button>
              <Button variant="outline" size="sm" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", durationRange[0] === 30 && durationRange[1] === 90 ? "bg-blue-500/20 border-blue-500/50 text-blue-500" : "border-white/10 text-white/60 hover:border-white/20")} onClick={() => setDurationRange([30, 90])}>30-90 dias</Button>
              <Button variant="outline" size="sm" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", durationRange[0] === 90 && durationRange[1] === 300 ? "bg-blue-500/20 border-blue-500/50 text-blue-500" : "border-white/10 text-white/60 hover:border-white/20")} onClick={() => setDurationRange([90, 300])}>90+ dias</Button>
            </div>
          </div>
        </Card>

        {/* Resultados */}
        <div className="flex-1 min-h-0">
          {searchMutation.isFetching && allAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Iniciando Mineração...</p>
            </div>
          ) : processedAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {processedAds.map((ad) => (
                <AdCardV3 
                  key={ad.id} 
                  ad={ad} 
                  onExpand={(ad, media) => setSelectedAd({ ad, media })} 
                />
              ))}
            </div>
          ) : hasSearched && !searchMutation.isFetching ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white uppercase tracking-tight">Nenhum anúncio encontrado</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Tente mudar as palavras-chave ou filtros</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                <img src="https://img.icons8.com/external-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto/64/external-pickaxe-construction-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto.png" className="w-20 h-20 relative opacity-10" alt="Minerador" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">Pronto para minerar?</p>
                <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest">Insira uma palavra-chave para começar a busca</p>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de Auto-Load */}
        {isAutoLoading && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                Auto-carregando: {allAds.length} de {AUTO_LOAD_LIMIT} anúncios...
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[9px] font-black uppercase text-red-500 hover:text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                  setIsAutoLoading(false);
                }}
              >
                Parar
              </Button>
            </div>
          </div>
        )}

        {/* Modal de Detalhes */}
        <AdDetailsModal 
          ad={selectedAd?.ad} 
          media={selectedAd?.media} 
          isOpen={!!selectedAd} 
          onClose={() => setSelectedAd(null)} 
        />
      </div>
    </DashboardLayout>
  );
}
