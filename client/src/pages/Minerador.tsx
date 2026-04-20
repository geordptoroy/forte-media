import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, Globe, Package, Layers, Languages } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { type ExtractionResult } from "../../../shared/adTypes";

// --- CONSTANTES E CONFIGURAÇÕES ---
const SCALE_LEVELS = [
  { min: 1, max: 9, key: "low_scale", color: "text-emerald-400 bg-emerald-400/10", icon: null },
  { min: 10, max: 19, key: "medium_scale", color: "text-emerald-300 bg-emerald-300/10", icon: null },
  { min: 20, max: 39, key: "high_scale", color: "text-orange-400 bg-orange-400/10", icon: null },
  { min: 40, max: 1000, key: "viral_scale", color: "text-red-500 bg-red-500/10", icon: "🔥" }
];

const COUNTRIES = [
  { code: "ALL", name: "all" },
  { code: "BR", name: "Brasil" },
  { code: "US", name: "EUA" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" }
];

const PRODUCT_TYPES = ["all", "infoproduct", "nutra", "dropshipping", "local_business", "fashion", "electronics", "services", "others"];
const FUNNEL_STRUCTURES = ["all", "TSL", "VSL", "X1", "Landing Page", "Quiz", "Type Bot"];
const AUTO_LOAD_LIMIT = 40;

// --- SUB-COMPONENTES AUXILIARES ---
const MiniLabel = memo(({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-1.5 ml-1 block font-mono">
    {children}
  </label>
));

const PageHeader = memo(({ resultsCount, hidePolitical, onTogglePolitical, currentLang, onToggleLang }: { 
  resultsCount: number, 
  hidePolitical: boolean, 
  onTogglePolitical: (val: boolean) => void,
  currentLang: string,
  onToggleLang: () => void
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-transparent flex items-center justify-center overflow-hidden">
          <img src="https://img.icons8.com/external-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto/64/external-pickaxe-construction-yogi-aprelliyanto-detailed-outline-yogi-aprelliyanto.png" alt="Minerador" className="w-6 h-6 object-contain" />
        </div>
        {resultsCount > 0 && (
          <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black px-2 py-0">
            {t('results_count', { count: resultsCount })}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleLang}
          className="bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10"
        >
          <Languages className="w-3.5 h-3.5" />
          {currentLang.toUpperCase()}
        </Button>
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/20 px-4 py-2 rounded-lg w-fit">
          <Filter className="w-3.5 h-3.5 text-white/80" />
          <span className="text-[11px] font-black uppercase text-white/90 whitespace-nowrap">
            {hidePolitical ? "Ocultar Ads Políticos" : "Exibir Ads Políticos"}
          </span>
          <Switch 
            checked={hidePolitical} 
            onCheckedChange={onTogglePolitical}
            className="scale-90 data-[state=checked]:bg-emerald-500"
          />
        </div>
      </div>
    </div>
  );
});

// --- COMPONENTE PRINCIPAL ---
export default function Minerador() {
  const { t, i18n } = useTranslation();
  
  // --- ESTADO ---
  const [filters, setFilters] = useState({
    searchTerms: "",
    country: "BR",
    selectedType: "all",
    selectedFunnel: "all",
  });

  const [hidePolitical, setHidePolitical] = useState(() => {
    const saved = localStorage.getItem("hidePolitical");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [allAds, setAllAds] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedAd, setSelectedAd] = useState<{ ad: any, media: ExtractionResult | null } | null>(null);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  
  // Sliders com Range (Min/Max)
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(1000);
  const [durationMin, setDurationMin] = useState(1);
  const [durationMax, setDurationMax] = useState(365);
  const [currency, setCurrency] = useState("ALL");
  const [minSpend, setMinSpend] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const adsCountRef = useRef(0);
  const nextCursorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    adsCountRef.current = allAds.length;
  }, [allAds.length]);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    localStorage.setItem("hidePolitical", JSON.stringify(hidePolitical));
  }, [hidePolitical]);

  // --- BUSCA (API) ---
  const searchMutation = trpc.ads.search.useQuery(
    { 
      searchTerms: filters.searchTerms, 
      country: filters.country, 
      adType: "ALL",
      after: nextCursor,
      scaleMin: scaleMin,
      scaleMax: scaleMax,
      durationMin: durationMin,
      durationMax: durationMax,
      currency: currency !== "ALL" ? currency : undefined,
      minSpend: minSpend > 0 ? minSpend : undefined,
      productTypes: filters.selectedType !== "all" ? [t(filters.selectedType)] : undefined,
      funnelTypes: filters.selectedFunnel !== "all" ? [filters.selectedFunnel] : undefined,
      excludePolitical: hidePolitical
    },
    { enabled: false, retry: false }
  );

  const executeSearch = useCallback(async (isNewSearch: boolean = true) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isNewSearch) {
      setIsAutoLoading(false);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setAllAds([]);
      setNextCursor(undefined);
      nextCursorRef.current = undefined;
      adsCountRef.current = 0;
    }

    try {
      const result = await searchMutation.refetch();
      if (result.data) {
        const ads = result.data.data;
        const cursor = result.data.paging?.next_cursor;
        
        if (isNewSearch) {
          setAllAds(ads);
          setHasSearched(true);
        } else {
          setAllAds(prev => [...prev, ...ads]);
        }
        
        setNextCursor(cursor);
        nextCursorRef.current = cursor;
        
        if (adsCountRef.current + ads.length < AUTO_LOAD_LIMIT && cursor) {
          setTimeout(() => {
            isFetchingRef.current = false;
            startAutoLoad();
          }, 500);
          return;
        }
      }
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [searchMutation]);

  const startAutoLoad = useCallback(async () => {
    if (isAutoLoading || !nextCursorRef.current || adsCountRef.current >= AUTO_LOAD_LIMIT || isFetchingRef.current) return;
    
    setIsAutoLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      while (adsCountRef.current < AUTO_LOAD_LIMIT && nextCursorRef.current && !controller.signal.aborted) {
        isFetchingRef.current = true;
        const result = await searchMutation.refetch();
        isFetchingRef.current = false;
        
        if (!result.data || controller.signal.aborted) break;

        const newAds = result.data.data;
        const cursor = result.data.paging?.next_cursor;
        
        setAllAds(prev => [...prev, ...newAds]);
        setNextCursor(cursor);
        nextCursorRef.current = cursor;
        
        if (!cursor) break;
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (error) {
      console.error("Erro no auto-carregamento:", error);
    } finally {
      setIsAutoLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [searchMutation, isAutoLoading]);

  // Debounce para busca por texto
  useEffect(() => {
    if (!filters.searchTerms && !hasSearched) return;
    const timer = setTimeout(() => executeSearch(true), 800);
    return () => clearTimeout(timer);
  }, [filters.searchTerms]);

  // Busca imediata para outros filtros
  useEffect(() => {
    if (hasSearched) executeSearch(true);
  }, [filters.country, hidePolitical, filters.selectedType, filters.selectedFunnel, scaleMin, scaleMax, durationMin, durationMax, currency, minSpend]);

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(nextLang);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-5 max-w-[1600px] mx-auto px-4 md:px-6 scale-[0.95] origin-top">
        
        <div className="mb-6">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">{t('minerador_title')}</span>
            <span className="text-white/20 font-light text-xl">{t('minerador_pro')}</span>
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mt-3">{t('minerador_subtitle')}</p>
        </div>
        
        <PageHeader 
          resultsCount={allAds.length} 
          hidePolitical={hidePolitical} 
          onTogglePolitical={setHidePolitical}
          currentLang={i18n.language}
          onToggleLang={toggleLanguage}
        />

        <Card className="p-4 bg-[#0A0A0A] border-white/20 rounded-xl shadow-xl">
          <form onSubmit={(e) => { e.preventDefault(); executeSearch(true); }} className="flex flex-col space-y-4">
            <div className="flex flex-col lg:flex-row items-end gap-3">
              <div className="w-full lg:w-[25%] space-y-0">
                <MiniLabel>{t('search_placeholder').split(':')[0]}</MiniLabel>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60 group-focus-within:text-white transition-colors" />
                  <Input
                    placeholder={t('search_placeholder')}
                    value={filters.searchTerms}
                    onChange={(e) => updateFilter("searchTerms", e.target.value)}
                    className="pl-9 bg-white/[0.03] border-white/20 rounded-lg h-10 text-[13px] font-medium focus:border-white/40 focus:ring-0 transition-all placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:flex items-end gap-2 w-full lg:w-auto">
                <div className="flex-1 space-y-0">
                  <MiniLabel>{t('country')}</MiniLabel>
                  <Select value={filters.country} onValueChange={(v) => updateFilter("country", v)}>
                    <SelectTrigger className="w-full bg-white/[0.03] border-white/20 rounded-lg h-10 text-[11px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3 h-3 text-white/60 shrink-0" />
                        <SelectValue placeholder={t('country')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-[11px] font-black uppercase py-2">{c.code === 'ALL' ? t('all') : c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-0">
                  <MiniLabel>{t('product_type')}</MiniLabel>
                  <Select value={filters.selectedType} onValueChange={(v) => updateFilter("selectedType", v)}>
                    <SelectTrigger className="w-full bg-white/[0.03] border-white/20 rounded-lg h-10 text-[11px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                      <div className="flex items-center gap-2 truncate">
                        <Package className="w-3 h-3 text-white/60 shrink-0" />
                        <SelectValue placeholder={t('product_type')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                      {PRODUCT_TYPES.map((t_key) => (
                        <SelectItem key={t_key} value={t_key} className="text-[11px] font-black uppercase py-2">{t(t_key)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-0">
                  <MiniLabel>{t('funnel')}</MiniLabel>
                  <Select value={filters.selectedFunnel} onValueChange={(v) => updateFilter("selectedFunnel", v)}>
                    <SelectTrigger className="w-full bg-white/[0.03] border-white/20 rounded-lg h-10 text-[11px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                      <div className="flex items-center gap-2 truncate">
                        <Layers className="w-3 h-3 text-white/60 shrink-0" />
                        <SelectValue placeholder={t('funnel')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                      {FUNNEL_STRUCTURES.map((f) => (
                        <SelectItem key={f} value={f} className="text-[11px] font-black uppercase py-2">{f === 'all' ? t('all') : f}</SelectItem>
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
                  t('minerar_btn')
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              {/* Filtro de Gasto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <MiniLabel>Gasto Mínimo (Investimento)</MiniLabel>
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                    {currency === 'ALL' ? '' : currency} {minSpend}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-[80px] bg-white/[0.03] border-white/20 h-8 text-[10px] font-black">
                      <SelectValue placeholder="Moeda" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/10">
                      <SelectItem value="ALL" className="text-[10px] font-black">TODAS</SelectItem>
                      <SelectItem value="BRL" className="text-[10px] font-black">BRL (R$)</SelectItem>
                      <SelectItem value="USD" className="text-[10px] font-black">USD ($)</SelectItem>
                      <SelectItem value="EUR" className="text-[10px] font-black">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    step="100"
                    value={minSpend} 
                    onChange={(e) => setMinSpend(parseInt(e.target.value))} 
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <MiniLabel>{t('scale_label')}</MiniLabel>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                    {scaleMin}-{scaleMax} {t('copies').toLowerCase()}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 space-y-2">
                    <MiniLabel>Min: {scaleMin}</MiniLabel>
                    <input 
                      type="range" 
                      min="1" 
                      max="1000" 
                      value={scaleMin} 
                      onChange={(e) => setScaleMin(Math.min(parseInt(e.target.value), scaleMax))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <MiniLabel>Max: {scaleMax}</MiniLabel>
                    <input 
                      type="range" 
                      min="1" 
                      max="1000" 
                      value={scaleMax} 
                      onChange={(e) => setScaleMax(Math.max(parseInt(e.target.value), scaleMin))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {SCALE_LEVELS.map((level) => (
                    <Button 
                      key={level.key} 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", 
                        scaleMin >= level.min && scaleMax <= level.max
                          ? level.color.replace("text-", "border-").replace("bg-", "bg-opacity-20 ") + " text-white"
                          : "border-white/10 text-white/60 hover:border-white/20"
                      )} 
                      onClick={() => { setScaleMin(level.min); setScaleMax(level.max); }}
                    >
                      {level.icon} {t(level.key)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <MiniLabel>{t('duration_label')}</MiniLabel>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                    {durationMin}-{durationMax} {t('active_days').split(' ')[1]}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 space-y-2">
                    <MiniLabel>Min: {durationMin}</MiniLabel>
                    <input 
                      type="range" 
                      min="1" 
                      max="365" 
                      value={durationMin} 
                      onChange={(e) => setDurationMin(Math.min(parseInt(e.target.value), durationMax))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <MiniLabel>Max: {durationMax}</MiniLabel>
                    <input 
                      type="range" 
                      min="1" 
                      max="365" 
                      value={durationMax} 
                      onChange={(e) => setDurationMax(Math.max(parseInt(e.target.value), durationMin))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { min: 1, max: 7, label: "1-7 " + t('active_days').split(' ')[1] },
                    { min: 7, max: 30, label: "7-30 " + t('active_days').split(' ')[1] },
                    { min: 30, max: 90, label: "30-90 " + t('active_days').split(' ')[1] },
                    { min: 90, max: 365, label: "90+ " + t('active_days').split(' ')[1] }
                  ].map((p) => (
                    <Button 
                      key={p.label}
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all", 
                        durationMin >= p.min && durationMax <= p.max
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-500" 
                          : "border-white/10 text-white/60 hover:border-white/20"
                      )} 
                      onClick={() => { setDurationMin(p.min); setDurationMax(p.max); }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </Card>

        <div className="flex-1 min-h-0">
          {searchMutation.isFetching && allAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Iniciando Mineração...</p>
            </div>
          ) : allAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {allAds.map((ad) => (
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
                <p className="text-sm font-black text-white uppercase tracking-tight">{t('no_ads_found')}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{t('try_different_filters')}</p>
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

        {isAutoLoading && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {t('auto_loading', { current: allAds.length, total: AUTO_LOAD_LIMIT })}
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
                {t('stop')}
              </Button>
            </div>
          </div>
        )}

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
